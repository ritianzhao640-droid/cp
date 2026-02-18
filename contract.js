// contract.js
// SwimLotteryPure 合约前端交互模块 (ethers.js v5)

// ==================== 配置 ====================
const CONFIG = {
    // 请替换为实际部署的合约地址
    contractAddress: '0x...',
    // 请替换为实际代币地址（AI币）
    tokenAddress: '0x...',
    // 请替换为实际WBNB地址（BSC主网：0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c）
    wbnbAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    // 链ID (BSC主网56，测试网97)
    chainId: 56,
    // RPC URL (可选，用于只读操作)
    rpcUrl: 'https://bsc-dataseed.binance.org/'
};

// ==================== ABI ====================
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
let tokenDecimals = 18;
let tokenSymbol = 'AI';

// 缓存数据
let cachedRounds = {};
let userRounds = [];
let burnRankData = []; // 燃烧排行数据

// ==================== 工具函数 ====================
function showToast(msg, duration = 3000) {
    if (window.showToast) window.showToast(msg, duration);
    else alert(msg);
}

function formatAmount(amount, decimals = 18, fixed = 4) {
    if (!amount) return '0';
    const formatted = ethers.utils.formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(fixed).replace(/\.?0+$/, '');
}

function parseAmount(amountStr, decimals = 18) {
    return ethers.utils.parseUnits(amountStr, decimals);
}

function shortenAddress(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
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
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) connectBtn.innerText = shortenAddress(currentAccount);
        
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.style.display = 'inline-block';
        
        const walletTip = document.getElementById('walletTip');
        if (walletTip) walletTip.style.display = 'block';

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
                const btn = document.getElementById('connectBtn');
                if (btn) btn.innerText = shortenAddress(currentAccount);
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
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) connectBtn.innerText = '连接钱包';
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.style.display = 'none';
    
    const walletTip = document.getElementById('walletTip');
    if (walletTip) walletTip.style.display = 'none';
    
    refreshData();
}

// ==================== 数据刷新 ====================
async function refreshData() {
    if (!contract) await initContract();

    try {
        // 获取公共数据
        const roundId = await contract.roundId();
        const wbnbBalance = await contract.getWBNBBalance();
        
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
            
            // 获取累计分红（通过事件计算或合约新加函数）
            const totalClaimed = await getTotalClaimedDividend(currentAccount);
            
            // 更新UI
            const userBalanceEl = document.getElementById('userBalance');
            if (userBalanceEl) userBalanceEl.innerText = formatAmount(userBalance, tokenDecimals);
            
            const burnPointsEl = document.getElementById('burnPoints');
            if (burnPointsEl) burnPointsEl.innerText = formatAmount(burnWeight, tokenDecimals);
            
            const burnWeightEl = document.getElementById('burnWeight');
            if (burnWeightEl) burnWeightEl.innerText = formatAmount(burnWeight, tokenDecimals);
            
            const totalBurnedEl = document.getElementById('totalBurned');
            if (totalBurnedEl) totalBurnedEl.innerText = formatAmount(burnWeight, tokenDecimals) + ' AI币';
            
            const myTicketCountEl = document.getElementById('myTicketCount');
            if (myTicketCountEl) myTicketCountEl.innerText = tickets.toString();
            
            const claimableAmountEl = document.getElementById('claimableAmount');
            if (claimableAmountEl) claimableAmountEl.innerText = formatAmount(pendingDiv, 18, 6);
            
            const totalDividendEl = document.getElementById('totalDividend');
            if (totalDividendEl) totalDividendEl.innerText = formatAmount(totalClaimed, 18, 6) + ' WBNB';
            
            const dailyDividendEl = document.getElementById('dailyDividend');
            if (dailyDividendEl) {
                // 估算每日分红
                const daily = await estimateDailyDividend(burnWeight);
                dailyDividendEl.innerText = daily;
            }
        } else {
            // 清空用户相关
            const elements = ['userBalance', 'burnPoints', 'burnWeight', 'myTicketCount', 'claimableAmount'];
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = '0';
            });
        }

        // 更新公共UI
        const dividendPoolEl = document.getElementById('dividendPool');
        if (dividendPoolEl) dividendPoolEl.innerText = formatAmount(wbnbBalance, 18, 4);
        
        const jackpotAmountEl = document.getElementById('jackpotAmount');
        if (jackpotAmountEl) jackpotAmountEl.innerText = currentRoundInfo ? formatAmount(currentRoundInfo.prizePool, tokenDecimals) : '0';
        
        // 更新当前轮次显示
        if (currentRoundInfo) {
            const currentRoundEl = document.getElementById('currentRound');
            if (currentRoundEl) currentRoundEl.innerText = currentRoundInfo.roundId;
            
            const roundPoolDisplayEl = document.getElementById('roundPoolDisplay');
            if (roundPoolDisplayEl) roundPoolDisplayEl.innerText = formatAmount(currentRoundInfo.prizePool, tokenDecimals);
            
            const totalTicketsDisplayEl = document.getElementById('totalTicketsDisplay');
            if (totalTicketsDisplayEl) totalTicketsDisplayEl.innerText = currentRoundInfo.totalTickets.toString();
            
            const participantCountEl = document.getElementById('participantCount');
            if (participantCountEl) participantCountEl.innerText = currentRoundInfo.totalTickets.toString();
            
            // 状态显示
            const roundStatusEl = document.getElementById('roundStatus');
            if (roundStatusEl) {
                if (currentRoundInfo.drawn) {
                    roundStatusEl.innerText = '已开奖';
                    roundStatusEl.className = 'round-status-badge status-drawn';
                } else if (Date.now() / 1000 >= currentRoundInfo.endTime) {
                    roundStatusEl.innerText = '可开奖';
                    roundStatusEl.className = 'round-status-badge status-pending';
                } else {
                    roundStatusEl.innerText = '进行中';
                    roundStatusEl.className = 'round-status-badge status-active';
                }
            }

            // 更新倒计时
            updateCountdown(currentRoundInfo.endTime, currentRoundInfo.drawn);
        }

        // 更新按钮状态
        updateBuyButton();
        
        const burnButton = document.getElementById('burnButton');
        if (burnButton) burnButton.disabled = !isConnected;
        
        const claimButton = document.getElementById('claimButton');
        if (claimButton) claimButton.disabled = !isConnected;

    } catch (e) {
        console.error('刷新数据失败', e);
        // 不显示错误toast，避免频繁弹出
    }
}

// 获取累计分红（通过查询事件）
async function getTotalClaimedDividend(userAddress) {
    if (!contract || !userAddress) return ethers.BigNumber.from(0);
    try {
        const filter = contract.filters.DividendClaimed(userAddress);
        const events = await contract.queryFilter(filter, 0, 'latest');
        let total = ethers.BigNumber.from(0);
        events.forEach(event => {
            total = total.add(event.args.wbnbAmount);
        });
        return total;
    } catch (e) {
        return ethers.BigNumber.from(0);
    }
}

// 估算每日分红
async function estimateDailyDividend(userBurnWeight) {
    if (!contract || !userBurnWeight || userBurnWeight.eq(0)) return '0';
    try {
        const totalWeight = await contract.totalBurnWeight();
        if (totalWeight.eq(0)) return '0';
        
        // 获取当前pendingTax作为参考
        const pendingTax = await contract.pendingTax();
        // 简化估算：假设每天产生类似的税收
        const dailyTax = pendingTax.mul(2); // 粗略估计
        const userShare = dailyTax.mul(userBurnWeight).div(totalWeight);
        
        return formatAmount(userShare, 18, 6);
    } catch (e) {
        return '0';
    }
}

// 倒计时
function updateCountdown(endTime, drawn) {
    const countdownEl = document.getElementById('countdown');
    const drawStatus = document.getElementById('drawStatus');
    const drawBtn = document.getElementById('drawBtn');

    if (!countdownEl || !drawStatus || !drawBtn) return;

    if (drawn) {
        countdownEl.innerText = '00:00';
        drawStatus.innerText = '本期已开奖';
        drawBtn.disabled = true;
        drawBtn.innerText = '已开奖';
        drawBtn.classList.remove('active');
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
            drawBtn.classList.remove('active');
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
    if (!buyBtn) return;
    
    if (!isConnected) {
        buyBtn.disabled = true;
        buyBtn.innerText = '请先连接钱包';
        return;
    }
    
    const roundIdEl = document.getElementById('currentRound');
    const roundId = roundIdEl ? parseInt(roundIdEl.innerText) : 0;
    
    if (roundId === 0) {
        buyBtn.disabled = true;
        buyBtn.innerText = '等待启动';
        return;
    }
    
    buyBtn.disabled = false;
    buyBtn.innerText = '确认购买';
}

// ==================== 购买彩票 ====================
async function buyTickets(ticketCount) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    const amount = ticketCount * 100;
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        // 检查授权
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.contractAddress);
        if (allowance.lt(amountWei)) {
            showToast('正在授权代币...', 2000);
            const txApprove = await tokenContract.approve(CONFIG.contractAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
            showToast('授权成功', 2000);
        }

        const tx = await contract.buyTicket(amountWei);
        showToast('交易已发送，等待确认...', 3000);
        await tx.wait();
        showToast('购买成功！');
        refreshData();
        loadRoundHistory();
    } catch (e) {
        console.error(e);
        showToast('购买失败: ' + (e.reason || e.message));
    }
}

// ==================== 燃烧代币 ====================
async function burnTokens(amountStr) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    const amount = parseFloat(amountStr);
    if (amount <= 0) {
        showToast('请输入有效数量');
        return;
    }
    
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        // 检查授权
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.contractAddress);
        if (allowance.lt(amountWei)) {
            showToast('正在授权代币...', 2000);
            const txApprove = await tokenContract.approve(CONFIG.contractAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
        }

        const tx = await contract.burnForDividend(amountWei);
        showToast('燃烧交易已发送...');
        await tx.wait();
        showToast('燃烧成功！');
        refreshData();
        loadBurnRank(); // 刷新排行
    } catch (e) {
        showToast('燃烧失败: ' + (e.reason || e.message));
    }
}

// ==================== 领取分红 ====================
async function claimDividend() {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    try {
        const pendingDiv = await contract.pendingDividend(currentAccount);
        if (pendingDiv.eq(0)) {
            showToast('没有可领取的分红');
            return;
        }
        
        const tx = await contract.claimTaxDividend();
        showToast('领取交易已发送...');
        await tx.wait();
        showToast('领取成功！');
        refreshData();
    } catch (e) {
        showToast('领取失败: ' + (e.reason || e.message));
    }
}

// ==================== 开奖 ====================
async function drawRound(roundId) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    try {
        const tx = await contract.drawRound(roundId);
        showToast('开奖交易已发送...');
        await tx.wait();
        showToast('开奖成功！');
        refreshData();
        loadRoundHistory();
    } catch (e) {
        showToast('开奖失败: ' + (e.reason || e.message));
    }
}

// ==================== 领取单个轮次奖金 ====================
async function claimPrize(roundId) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    try {
        const tx = await contract.claimPrize(roundId);
        showToast('领取交易已发送...');
        await tx.wait();
        showToast('领取成功！');
        refreshData();
        loadRoundHistory();
    } catch (e) {
        showToast('领取失败: ' + (e.reason || e.message));
    }
}

// ==================== 一键领取所有奖金 ====================
async function claimAllPrizes() {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    const unclaimedRounds = userRounds.filter(r => r.unclaimedCount > 0);
    if (unclaimedRounds.length === 0) {
        showToast('没有可领取的奖金');
        return;
    }
    
    showToast(`开始领取 ${unclaimedRounds.length} 个轮次的奖金...`, 3000);
    
    let successCount = 0;
    for (let r of unclaimedRounds) {
        try {
            const tx = await contract.claimPrize(r.roundId);
            await tx.wait();
            successCount++;
        } catch (e) {
            console.error(`轮次 ${r.roundId} 领取失败`, e);
        }
    }
    
    showToast(`成功领取 ${successCount} 个轮次！`);
    refreshData();
    loadRoundHistory();
}

// ==================== 加载历史开奖记录 ====================
async function loadRoundHistory() {
    if (!contract) await initContract();
    
    const historyDiv = document.getElementById('historyList');
    const claimAllBtn = document.getElementById('claimAllBtn');
    
    if (!historyDiv) return;

    try {
        const roundId = await contract.roundId();
        if (roundId === 0) {
            historyDiv.innerHTML = '<div class="empty-history">暂无历史记录</div>';
            if (claimAllBtn) claimAllBtn.style.display = 'none';
            return;
        }

        let html = '';
        let hasUnclaimed = false;
        userRounds = [];

        // 从最新轮次往前遍历（最多10轮）
        const start = roundId > 10 ? roundId - 9 : 1;
        
        for (let i = roundId; i >= start; i--) {
            try {
                const info = await contract.getRoundInfo(i);
                const drawn = info.drawn;
                const winners = info.winners;
                const prizePool = info.prizePool;

                let userWon = false;
                let userUnclaimedCount = 0;

                if (currentAccount && drawn) {
                    try {
                        const userInfo = await contract.getUserPrizeInfo(i, currentAccount);
                        userWon = userInfo.totalWon.gt(0);
                        userUnclaimedCount = userInfo.unclaimedCount;
                        if (userUnclaimedCount > 0) {
                            hasUnclaimed = true;
                            userRounds.push({
                                roundId: i,
                                unclaimedCount: userUnclaimedCount
                            });
                        }
                    } catch (e) {}
                }

                if (drawn) {
                    const winnersText = winners.length > 0 
                        ? `${winners.length}位中奖者` 
                        : '无人中奖';
                    
                    const itemClass = userWon ? 'history-item won' : 'history-item';
                    
                    html += `
                    <div class="${itemClass}">
                        <div class="round-info">
                            <div class="round-id">第 ${i} 期 ${userWon ? '<span class="winner-badge">中奖</span>' : ''}</div>
                            <div class="round-pool">奖池: ${formatAmount(prizePool, tokenDecimals)} AI币</div>
                        </div>
                        <div class="round-detail">
                            <div>${winnersText}</div>
                            ${userWon && userUnclaimedCount > 0 
                                ? `<button class="claim-btn-small can-claim" onclick="ContractAPI.claimPrize(${i})">领取</button>`
                                : userWon ? '<span style="color:#00b894;">已领</span>' : ''
                            }
                        </div>
                    </div>`;
                }
            } catch (e) {
                console.error(`加载轮次 ${i} 失败`, e);
            }
        }

        if (html === '') {
            html = '<div class="empty-history">暂无历史记录</div>';
        }
        
        historyDiv.innerHTML = html;
        if (claimAllBtn) claimAllBtn.style.display = hasUnclaimed ? 'flex' : 'none';

    } catch (e) {
        console.error('加载历史失败', e);
        historyDiv.innerHTML = '<div class="empty-history">加载失败</div>';
    }
}

// ==================== 加载燃烧排行 ====================
async function loadBurnRank() {
    if (!contract) await initContract();
    
    const rankList = document.getElementById('rankList');
    if (!rankList) return;

    try {
        // 通过Burn事件获取燃烧数据
        const filter = contract.filters.Burn();
        const events = await contract.queryFilter(filter, 0, 'latest');
        
        // 统计每个地址的燃烧量
        const burnMap = new Map();
        
        events.forEach(event => {
            const user = event.args.user;
            const amount = event.args.amount;
            
            if (burnMap.has(user)) {
                burnMap.set(user, burnMap.get(user).add(amount));
            } else {
                burnMap.set(user, amount);
            }
        });
        
        // 转换为数组并排序
        const sortedBurns = Array.from(burnMap.entries())
            .sort((a, b) => b[1].cmp(a[1]))
            .slice(0, 20); // 前20名
        
        burnRankData = sortedBurns;

        if (sortedBurns.length === 0) {
            rankList.innerHTML = '<div class="empty-rank">暂无燃烧记录</div>';
            return;
        }

        let html = `
        <div class="rank-header">
            <span>排名</span>
            <span>地址</span>
            <span>燃烧量</span>
        </div>`;

        sortedBurns.forEach((item, index) => {
            const rank = index + 1;
            const address = item[0];
            const amount = item[1];
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            
            html += `
            <div class="rank-item">
                <div class="rank-number ${rankClass}">#${rank}</div>
                <div class="rank-address" title="${address}">${shortenAddress(address)}</div>
                <div class="rank-amount">${formatAmount(amount, tokenDecimals)} AI</div>
            </div>`;
        });

        rankList.innerHTML = html;

    } catch (e) {
        console.error('加载燃烧排行失败', e);
        rankList.innerHTML = '<div class="empty-rank">加载失败</div>';
    }
}

// ==================== 更新中奖概率 ====================
async function updateWinChance() {
    if (!currentAccount || !contract) return;
    
    try {
        const tickets = await contract.tickets(currentAccount);
        const currentRoundInfo = await contract.getCurrentRoundInfo();
        const totalTickets = currentRoundInfo.totalTickets;
        
        const winChanceEl = document.getElementById('winChance');
        if (!winChanceEl) return;
        
        if (totalTickets > 0) {
            const chance = (tickets * 100) / totalTickets;
            winChanceEl.innerText = chance.toFixed(2) + '%';
        } else {
            winChanceEl.innerText = '0%';
        }
    } catch (e) {
        console.error('更新中奖概率失败', e);
    }
}

// ==================== 更新每日分红估算 ====================
async function updateDailyDividend(burnAmount) {
    const dailyDividendEl = document.getElementById('dailyDividend');
    if (!dailyDividendEl || !contract) return;
    
    try {
        const amount = parseFloat(burnAmount) || 0;
        if (amount === 0) {
            dailyDividendEl.innerText = '0';
            return;
        }
        
        const amountWei = parseAmount(amount.toString(), tokenDecimals);
        const daily = await estimateDailyDividend(amountWei);
        dailyDividendEl.innerText = daily;
    } catch (e) {
        dailyDividendEl.innerText = '0';
    }
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
    loadBurnRank,
    updateWinChance,
    updateDailyDividend,
    getContract: () => contract
};

// 初始化
initContract().then(() => {
    refreshData();
    loadRoundHistory();
    
    // 启动定时刷新
    setInterval(() => {
        if (document.getElementById('homePage')?.classList.contains('active')) {
            refreshData();
        }
    }, 30000); // 30秒刷新一次
});

// 监听网络变化
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}
