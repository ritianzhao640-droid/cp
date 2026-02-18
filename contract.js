// contract.js
// SwimLotteryPure 合约前端交互模块 (ethers.js v5)

// ==================== 配置 ====================
const CONFIG = {
    // 请替换为实际部署的合约地址
    contractAddress: '0x...',
    // 请替换为实际代币地址（AI币）
    tokenAddress: '0x...',
    // 请替换为实际WBNB地址（BSC主网：0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c）
    wbnbAddress: '0x...',
    // 链ID (BSC主网56，测试网97)
    chainId: 97,
    // RPC URL (可选，用于只读操作)
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
};

// ==================== ABI ====================
// 从合约编译后提取的ABI（仅包含用到的函数和事件）
const CONTRACT_ABI = [
    // ---------- 视图函数 ----------
    "function token() view returns (address)",
    "function wbnb() view returns (address)",
    "function tokenSet() view returns (bool)",
    "function burnWeight(address) view returns (uint256)",
    "function totalBurnWeight() view returns (uint256)",
    "function pendingTax() view returns (uint256)",
    "function accTaxPerShare() view returns (uint256)",
    "function userAccTaxPerShare(address) view returns (uint256)",
    "function unclaimedDividend(address) view returns (uint256)",
    "function totalStaked() view returns (uint256)",
    "function tickets(address) view returns (uint256)",
    "function roundId() view returns (uint256)",
    "function prizeReleaseRate() view returns (uint256)",
    "function totalUnclaimedPrizes() view returns (uint256)",
    "function getWBNBBalance() view returns (uint256)",
    "function getCurrentRoundInfo() view returns (uint256 roundId, uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, uint256 timeRemaining, bool canDraw)",
    "function getRoundInfo(uint256 _roundId) view returns (uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, address[] memory winners, uint256[] memory winnerShares)",
    "function getUserPrizeInfo(uint256 _roundId, address user) view returns (uint256 totalWon, uint256 claimedCount, uint256 unclaimedCount, uint256 unclaimedAmount)",
    "function pendingDividend(address user) view returns (uint256)",
    
    // ---------- 写函数 ----------
    "function setToken(address _token) external",
    "function burnForDividend(uint256 amount) external",
    "function buyTicket(uint256 amount) external",
    "function claimTaxDividend() external",
    "function drawRound(uint256 _roundId) external",
    "function claimPrize(uint256 _roundId) external",
    
    // ---------- 事件 ----------
    "event TokenSet(address indexed token, address indexed wbnb)",
    "event Burn(address indexed user, uint256 amount, uint256 cachedDividend)",
    "event TicketBought(address indexed user, uint256 amount, uint256 roundId)",
    "event DividendClaimed(address indexed user, uint256 wbnbAmount)",
    "event NewRound(uint256 indexed roundId, uint256 prizePool, uint256 startTime, uint256 endTime)",
    "event RoundDrawn(uint256 indexed roundId, address[] winners, uint256[] shares, uint256 randomSeed)",
    "event PrizeClaimed(address indexed user, uint256 indexed roundId, uint256 amount, uint256 claimCount)",
    "event TaxReceived(uint256 bnbAmount)",
    "event DividendCached(address indexed user, uint256 amount)"
];

// ERC20 ABI (简化)
const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// ==================== 状态 ====================
let provider, signer, contract, tokenContract;
let currentAccount = null;
let isConnected = false;
let tokenDecimals = 18; // 默认，实际会获取
let tokenSymbol = 'AI';

// 缓存数据
let cachedRounds = {};   // roundId => 轮次信息
let userRounds = [];     // 用户参与过的轮次（用于历史记录）

// ==================== 工具函数 ====================
function showToast(msg, duration = 3000) {
    if (window.showToast) window.showToast(msg, duration);
    else alert(msg);
}

function formatAmount(amount, decimals = 18) {
    if (!amount) return '0';
    return ethers.utils.formatUnits(amount, decimals);
}

function parseAmount(amountStr, decimals = 18) {
    return ethers.utils.parseUnits(amountStr, decimals);
}

// ==================== 初始化 ====================
async function initProvider() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
        provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
        showToast('未检测到钱包，使用只读模式', 4000);
    }
    return provider;
}

async function initContract() {
    if (!provider) await initProvider();
    contract = new ethers.Contract(CONFIG.contractAddress, CONTRACT_ABI, provider);
    // 代币合约
    tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, provider);
    try {
        tokenDecimals = await tokenContract.decimals();
        tokenSymbol = await tokenContract.symbol();
    } catch (e) {
        console.warn('获取代币信息失败', e);
    }
}

// ==================== 连接钱包 ====================
async function connectWallet() {
    if (!window.ethereum) {
        showToast('请安装MetaMask');
        return;
    }
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        currentAccount = await signer.getAddress();
        isConnected = true;

        // 更新UI
        document.getElementById('connectBtn').innerText = shortenAddress(currentAccount);
        document.querySelector('.refresh-btn').style.display = 'inline-block';
        
        // 初始化合约（带signer）
        contract = contract.connect(signer);
        tokenContract = tokenContract.connect(signer);

        // 检查网络
        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.chainId) {
            showToast(`请切换到链ID ${CONFIG.chainId}`, 5000);
        }

        // 刷新数据
        await refreshData();
        await loadRoundHistory();

        // 监听账户变化
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                currentAccount = accounts[0];
                document.getElementById('connectBtn').innerText = shortenAddress(currentAccount);
                refreshData();
            }
        });

    } catch (e) {
        console.error(e);
        showToast('连接钱包失败: ' + e.message);
    }
}

function disconnectWallet() {
    isConnected = false;
    currentAccount = null;
    signer = null;
    document.getElementById('connectBtn').innerText = '连接钱包';
    document.querySelector('.refresh-btn').style.display = 'none';
    // 清空数据
    refreshData(); // 会显示默认值
}

function shortenAddress(addr) {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ==================== 数据刷新 ====================
async function refreshData() {
    if (!contract) await initContract();

    try {
        // 获取公共数据
        const roundId = await contract.roundId();
        const totalStaked = await contract.totalStaked();
        const totalUnclaimedPrizes = await contract.totalUnclaimedPrizes();
        const wbnbBalance = await contract.getWBNBBalance(); // 分红池总大小
        const pendingTax = await contract.pendingTax();
        
        // 获取当前轮次信息
        let currentRoundInfo = null;
        if (roundId > 0) {
            currentRoundInfo = await contract.getCurrentRoundInfo();
        }

        // 如果有连接的用户，获取用户数据
        if (currentAccount) {
            const userBalance = await tokenContract.balanceOf(currentAccount);
            const burnWeight = await contract.burnWeight(currentAccount);
            const tickets = await contract.tickets(currentAccount);
            const pendingDiv = await contract.pendingDividend(currentAccount);
            
            // 更新UI
            document.getElementById('userBalance').innerText = formatAmount(userBalance, tokenDecimals);
            document.getElementById('burnPoints').innerText = formatAmount(burnWeight, tokenDecimals);
            document.getElementById('burnWeight').innerText = formatAmount(burnWeight, tokenDecimals); // 燃烧页显示
            document.getElementById('totalBurned').innerText = formatAmount(burnWeight, tokenDecimals) + ' AI币';
            
            // 我的本期彩票数
            document.getElementById('myTicketCount').innerText = formatAmount(tickets, tokenDecimals);
            
            // 待领取分红
            document.getElementById('claimableAmount').innerText = formatAmount(pendingDiv, 18); // WBNB是18位
        } else {
            // 清空用户相关
            document.getElementById('userBalance').innerText = '0';
            document.getElementById('burnPoints').innerText = '0';
            document.getElementById('myTicketCount').innerText = '0';
            document.getElementById('claimableAmount').innerText = '0';
        }

        // 更新公共UI
        document.getElementById('dividendPool').innerText = formatAmount(wbnbBalance, 18);
        document.getElementById('totalDistributed').innerText = '0'; // 累计分红暂不实现
        document.getElementById('jackpotAmount').innerText = currentRoundInfo ? formatAmount(currentRoundInfo.prizePool, tokenDecimals) : '0';
        
        // 更新当前轮次显示
        if (currentRoundInfo) {
            document.getElementById('currentRound').innerText = currentRoundInfo.roundId;
            document.getElementById('roundPoolDisplay').innerText = formatAmount(currentRoundInfo.prizePool, tokenDecimals);
            document.getElementById('totalTicketsDisplay').innerText = currentRoundInfo.totalTickets;
            // 参与人数需要从ticketAddresses长度获取，但getCurrentRoundInfo没有，需要额外调用
            try {
                const roundDetail = await contract.getRoundInfo(currentRoundInfo.roundId);
                document.getElementById('participantCount').innerText = roundDetail[5].length; // winners数组实际是ticketAddresses? 注意getRoundInfo返回的是winners，不是参与者。这里需要修正。
                // 临时：无法获取参与者人数，显示总票数
                document.getElementById('participantCount').innerText = currentRoundInfo.totalTickets;
            } catch (e) {}
            
            // 状态显示
            if (currentRoundInfo.drawn) {
                document.getElementById('roundStatus').innerText = '已开奖';
                document.getElementById('roundStatus').className = 'round-status-badge status-drawn';
            } else if (Date.now() / 1000 >= currentRoundInfo.endTime) {
                document.getElementById('roundStatus').innerText = '可开奖';
                document.getElementById('roundStatus').className = 'round-status-badge status-pending';
            } else {
                document.getElementById('roundStatus').innerText = '进行中';
                document.getElementById('roundStatus').className = 'round-status-badge status-active';
            }

            // 更新倒计时
            updateCountdown(currentRoundInfo.endTime, currentRoundInfo.drawn);
        }

        // 更新购买按钮状态
        updateBuyButton();

        // 更新燃烧按钮状态
        document.getElementById('burnButton').disabled = !isConnected;
        document.getElementById('claimButton').disabled = !isConnected;

    } catch (e) {
        console.error('刷新数据失败', e);
        showToast('数据加载失败: ' + e.message);
    }
}

// 倒计时
function updateCountdown(endTime, drawn) {
    const countdownEl = document.getElementById('countdown');
    const drawStatus = document.getElementById('drawStatus');
    const drawBtn = document.getElementById('drawBtn');

    if (drawn) {
        countdownEl.innerText = '00:00';
        drawStatus.innerText = '本期已开奖';
        drawBtn.disabled = true;
        drawBtn.innerText = '已开奖';
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    if (remaining <= 0) {
        countdownEl.innerText = '00:00';
        drawStatus.innerText = '等待开奖';
        if (isConnected) {
            drawBtn.disabled = false;
            drawBtn.innerText = '立即开奖';
            drawBtn.classList.add('active');
        } else {
            drawBtn.disabled = true;
            drawBtn.innerText = '连接钱包开奖';
        }
    } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        countdownEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        drawStatus.innerText = '购买彩票参与抽奖';
        drawBtn.disabled = true;
        drawBtn.innerText = '开奖倒计时';
        drawBtn.classList.remove('active');
    }
}

// 更新购买按钮状态
function updateBuyButton() {
    const buyBtn = document.getElementById('buyBtn');
    if (!isConnected) {
        buyBtn.disabled = true;
        buyBtn.innerText = '请先连接钱包';
        return;
    }
    const roundId = parseInt(document.getElementById('currentRound').innerText);
    if (roundId === 0) {
        buyBtn.disabled = true;
        buyBtn.innerText = '等待启动';
        return;
    }
    // 检查是否已开奖或结束？由合约控制，前端简单启用
    buyBtn.disabled = false;
    buyBtn.innerText = '确认购买';
}

// ==================== 购买彩票 ====================
async function buyTickets(ticketCount) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    const amount = ticketCount * 100; // 100 AI币/张
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        // 检查授权
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.contractAddress);
        if (allowance.lt(amountWei)) {
            showToast('请先授权代币', 2000);
            // 尝试授权
            const txApprove = await tokenContract.approve(CONFIG.contractAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
            showToast('授权成功', 2000);
        }

        // 调用购买
        const tx = await contract.buyTicket(amountWei);
        showToast('交易已发送，等待确认...', 3000);
        await tx.wait();
        showToast('购买成功！');
        refreshData();
        loadRoundHistory();
    } catch (e) {
        console.error(e);
        showToast('购买失败: ' + e.message);
    }
}

// ==================== 燃烧代币 ====================
async function burnTokens(amountStr) {
    if (!isConnected) return;
    const amount = parseFloat(amountStr);
    if (amount <= 0) return;
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        // 检查授权
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.contractAddress);
        if (allowance.lt(amountWei)) {
            const txApprove = await tokenContract.approve(CONFIG.contractAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
        }

        const tx = await contract.burnForDividend(amountWei);
        showToast('燃烧交易已发送...');
        await tx.wait();
        showToast('燃烧成功！');
        refreshData();
    } catch (e) {
        showToast('燃烧失败: ' + e.message);
    }
}

// ==================== 领取分红 ====================
async function claimDividend() {
    if (!isConnected) return;
    try {
        const tx = await contract.claimTaxDividend();
        showToast('领取交易已发送...');
        await tx.wait();
        showToast('领取成功！');
        refreshData();
    } catch (e) {
        showToast('领取失败: ' + e.message);
    }
}

// ==================== 开奖 ====================
async function drawRound(roundId) {
    if (!isConnected) return;
    try {
        const tx = await contract.drawRound(roundId);
        showToast('开奖交易已发送...');
        await tx.wait();
        showToast('开奖成功！');
        refreshData();
        loadRoundHistory();
    } catch (e) {
        showToast('开奖失败: ' + e.message);
    }
}

// ==================== 领取单个轮次奖金 ====================
async function claimPrize(roundId) {
    if (!isConnected) return;
    try {
        const tx = await contract.claimPrize(roundId);
        showToast('领取交易已发送...');
        await tx.wait();
        showToast('领取成功！');
        refreshData();
        loadRoundHistory();
    } catch (e) {
        showToast('领取失败: ' + e.message);
    }
}

// ==================== 一键领取所有奖金 ====================
async function claimAllPrizes() {
    if (!isConnected) return;
    // 获取用户有未领奖金的轮次
    const roundIds = userRounds.filter(r => r.unclaimedCount > 0).map(r => r.roundId);
    if (roundIds.length === 0) {
        showToast('没有可领取的奖金');
        return;
    }
    showToast(`开始领取 ${roundIds.length} 个轮次的奖金...`, 3000);
    for (let rid of roundIds) {
        try {
            const tx = await contract.claimPrize(rid);
            await tx.wait();
        } catch (e) {
            console.error(`轮次 ${rid} 领取失败`, e);
            showToast(`轮次 ${rid} 领取失败: ${e.message}`);
            // 继续尝试下一个
        }
    }
    showToast('批量领取完成！');
    refreshData();
    loadRoundHistory();
}

// ==================== 加载历史开奖记录 ====================
async function loadRoundHistory() {
    if (!contract) await initContract();
    const historyDiv = document.getElementById('historyList');
    const claimAllBtn = document.getElementById('claimAllBtn');

    try {
        const roundId = await contract.roundId();
        if (roundId === 0) {
            historyDiv.innerHTML = '<div class="empty-history">暂无历史记录</div>';
            claimAllBtn.style.display = 'none';
            return;
        }

        let html = '';
        let hasUnclaimed = false;
        userRounds = [];

        // 从最新轮次往前遍历（最多20轮）
        const start = roundId > 20 ? roundId - 19 : 1;
        for (let i = roundId; i >= start; i--) {
            const info = await contract.getRoundInfo(i);
            const drawn = info.drawn;
            const winners = info.winners;
            const shares = info.winnerShares;
            const prizePool = info.prizePool;

            let userWon = false;
            let userClaimedCount = 0;
            let userUnclaimedCount = 0;
            let userTotalAmount = 0;

            if (currentAccount && drawn) {
                // 获取用户在该轮次的中奖信息
                try {
                    const userInfo = await contract.getUserPrizeInfo(i, currentAccount);
                    userTotalAmount = userInfo.totalWon;
                    userClaimedCount = userInfo.claimedCount;
                    userUnclaimedCount = userInfo.unclaimedCount;
                    userWon = userTotalAmount.gt(0);
                    if (userUnclaimedCount > 0) hasUnclaimed = true;
                } catch (e) {}
            }

            if (drawn) {
                const winnersList = winners.join(', ').substring(0, 30) + (winners.length > 2 ? '...' : '');
                const itemClass = userWon ? 'history-item won' : 'history-item';
                html += `<div class="${itemClass}">
                    <div class="round-info">
                        <div class="round-id">第 ${i} 期 ${userWon ? '<span class="winner-badge">中奖</span>' : ''}</div>
                        <div class="round-pool">奖池: ${formatAmount(prizePool, tokenDecimals)} AI币</div>
                    </div>
                    <div class="round-detail">
                        <div>${winnersList}</div>`;
                if (userWon && userUnclaimedCount > 0) {
                    html += `<button class="claim-btn-small can-claim" onclick="ContractAPI.claimPrize(${i})">领取</button>`;
                } else if (userWon && userUnclaimedCount === 0) {
                    html += `<span style="color:#00b894;">已领</span>`;
                }
                html += `</div></div>`;
            }
        }

        if (html === '') {
            html = '<div class="empty-history">暂无历史记录</div>';
        }
        historyDiv.innerHTML = html;
        claimAllBtn.style.display = hasUnclaimed ? 'flex' : 'none';

    } catch (e) {
        console.error('加载历史失败', e);
    }
}

// ==================== 更新中奖概率 ====================
async function updateWinChance() {
    if (!currentAccount || !contract) return;
    try {
        const tickets = await contract.tickets(currentAccount);
        const currentRoundInfo = await contract.getCurrentRoundInfo();
        const totalTickets = currentRoundInfo.totalTickets;
        if (totalTickets > 0) {
            const chance = (tickets * 100) / totalTickets;
            document.getElementById('winChance').innerText = chance.toFixed(2) + '%';
        } else {
            document.getElementById('winChance').innerText = '0%';
        }
    } catch (e) {}
}

// ==================== 更新每日分红估算 ====================
async function updateDailyDividend(burnAmount) {
    // 估算逻辑：根据当前pendingTax和总权重，乘以用户的权重
    // 这里简化，根据过去24小时分红估算？无法简单估算，暂时不实现
    document.getElementById('dailyDividend').innerText = '0';
}

// ==================== 导出API ====================
window.ContractAPI = {
    connectWallet,
    refreshData,
    buyTickets,
    burnTokens,
    claimDividend,
    drawRound,
    claimPrize,
    claimAllPrizes,
    loadRoundHistory,
    updateWinChance,
    updateDailyDividend,
    // 辅助
    getContract: () => contract
};

// 初始化
initContract().then(() => {
    refreshData();
    loadRoundHistory();
});

// 监听网络变化
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}
