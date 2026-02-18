// contract.js
// AI彩票项目 - 双合约接口配置 (ethers.js v5)

// ==================== 配置 ====================
const CONFIG = {
    // 销毁分红合约地址（彩票、燃烧、分红逻辑）
    burnPoolAddress: '0x07bA400b488fa4F3dBeDA52d5f1842a8EB67cA25',
    
    // 代币合约地址（AI币，标准ERC20）
    tokenAddress: '0x5437ccc083f121c5d1994d83f4f32a9cd2c57777',
    
    // WBNB地址（BSC主网）
    wbnbAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    
    // 链ID (BSC主网56，测试网97)
    chainId: 56,
    
    // RPC URL
    rpcUrl: 'https://bsc-dataseed.binance.org/'
};

// ==================== ABI 定义 ====================

// ---------- 1. 销毁分红合约 ABI (BurnPool Contract) ----------
const BURN_POOL_ABI = [
    // 视图函数
    "function token() view returns (address)",
    "function wbnb() view returns (address)",
    "function tokenSet() view returns (bool)",
    "function burnWeight(address user) view returns (uint256)",
    "function totalBurnWeight() view returns (uint256)",
    "function pendingTax() view returns (uint256)",
    "function accTaxPerShare() view returns (uint256)",
    "function userAccTaxPerShare(address user) view returns (uint256)",
    "function unclaimedDividend(address user) view returns (uint256)",
    "function pendingDividend(address user) view returns (uint256)",
    "function getWBNBBalance() view returns (uint256)",
    "function roundId() view returns (uint256)",
    "function totalStaked() view returns (uint256)",
    "function tickets(address user) view returns (uint256)",
    "function prizeReleaseRate() view returns (uint256)",
    "function totalUnclaimedPrizes() view returns (uint256)",
    "function getCurrentRoundInfo() view returns (uint256 roundId, uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, uint256 timeRemaining, bool canDraw)",
    "function getRoundInfo(uint256 _roundId) view returns (uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, address[] memory winners, uint256[] memory winnerShares)",
    "function getUserPrizeInfo(uint256 _roundId, address user) view returns (uint256 totalWon, uint256 claimedCount, uint256 unclaimedCount, uint256 unclaimedAmount)",
    
    // 写函数
    "function setToken(address _token) external",
    "function burnForDividend(uint256 amount) external",
    "function claimTaxDividend() external",
    "function buyTicket(uint256 amount) external",
    "function drawRound(uint256 _roundId) external",
    "function claimPrize(uint256 _roundId) external",
    
    // 事件
    "event TokenSet(address indexed token, address indexed wbnb)",
    "event Burn(address indexed user, uint256 amount, uint256 cachedDividend)",
    "event DividendClaimed(address indexed user, uint256 wbnbAmount)",
    "event DividendCached(address indexed user, uint256 amount)",
    "event TaxReceived(uint256 bnbAmount)",
    "event TicketBought(address indexed user, uint256 amount, uint256 roundId)",
    "event NewRound(uint256 indexed roundId, uint256 prizePool, uint256 startTime, uint256 endTime)",
    "event RoundDrawn(uint256 indexed roundId, address[] winners, uint256[] shares, uint256 randomSeed)",
    "event PrizeClaimed(address indexed user, uint256 indexed roundId, uint256 amount, uint256 claimCount)"
];

// ---------- 2. 代币合约 ABI (Standard ERC20) ----------
const TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ==================== 状态管理 ====================
let provider, signer;
let burnPoolContract, tokenContract;
let currentAccount = null;
let isConnected = false;
let tokenDecimals = 18;
let tokenSymbol = 'AI';

// 缓存数据
let cachedRounds = {};
let userRounds = [];
let burnRankData = [];

// ==================== 工具函数 ====================
function showToast(msg, duration = 3000) {
    if (window.showToast) window.showToast(msg, duration);
    else alert(msg);
}

function formatAmount(amount, decimals = 18, fixed = 4) {
    if (!amount) return '0';
    try {
        const formatted = ethers.utils.formatUnits(amount, decimals);
        const num = parseFloat(formatted);
        if (num === 0) return '0';
        if (num < 0.0001) return '<0.0001';
        return num.toFixed(fixed).replace(/\.?0+$/, '');
    } catch (e) {
        console.error('formatAmount error:', e);
        return '0';
    }
}

function parseAmount(amountStr, decimals = 18) {
    try {
        return ethers.utils.parseUnits(amountStr.toString(), decimals);
    } catch (e) {
        console.error('Parse amount error:', e);
        return ethers.BigNumber.from(0);
    }
}

function shortenAddress(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ==================== 初始化函数 ====================
async function initProvider() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
        provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
        showToast('未检测到钱包，使用只读模式', 4000);
    }
    return provider;
}

async function initContracts() {
    if (!provider) await initProvider();
    
    burnPoolContract = new ethers.Contract(CONFIG.burnPoolAddress, BURN_POOL_ABI, provider);
    tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);
    
    try {
        [tokenDecimals, tokenSymbol] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol()
        ]);
    } catch (e) {
        console.warn('获取代币信息失败，使用默认值:', e);
        tokenDecimals = 18;
        tokenSymbol = 'AI';
    }
    
    return { burnPoolContract, tokenContract };
}

async function connectContractsWithSigner() {
    if (!signer) throw new Error('No signer available');
    burnPoolContract = burnPoolContract.connect(signer);
    tokenContract = tokenContract.connect(signer);
    return { burnPoolContract, tokenContract };
}

// ==================== 钱包连接 ====================
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

        updateWalletUI();
        await connectContractsWithSigner();

        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.chainId) {
            showToast(`请切换到链ID ${CONFIG.chainId}`, 5000);
        }

        await refreshAllData();

        setupEventListeners();

    } catch (e) {
        console.error('连接钱包失败:', e);
        showToast('连接钱包失败: ' + e.message);
    }
}

function disconnectWallet() {
    isConnected = false;
    currentAccount = null;
    signer = null;
    
    if (provider) {
        burnPoolContract = new ethers.Contract(CONFIG.burnPoolAddress, BURN_POOL_ABI, provider);
        tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);
    }
    
    updateWalletUI();
    refreshAllData();
}

function updateWalletUI() {
    const connectBtn = document.getElementById('connectBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const walletTip = document.getElementById('walletTip');
    
    if (connectBtn) {
        connectBtn.innerText = isConnected ? shortenAddress(currentAccount) : '连接钱包';
    }
    if (refreshBtn) {
        refreshBtn.style.display = isConnected ? 'inline-block' : 'none';
    }
    if (walletTip) {
        walletTip.style.display = isConnected ? 'block' : 'none';
    }
}

function setupEventListeners() {
    if (!window.ethereum) return;
    
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            currentAccount = accounts[0];
            updateWalletUI();
            refreshAllData();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// ==================== 数据刷新 ====================
async function refreshAllData() {
    try {
        await Promise.all([
            refreshUserData(),
            refreshPoolData(),
            refreshRoundData()
        ]);
    } catch (e) {
        console.error('刷新数据失败:', e);
    }
}

async function refreshUserData() {
    if (!burnPoolContract || !tokenContract) await initContracts();
    
    if (!currentAccount) {
        clearUserUI();
        return;
    }

    try {
        const [
            userBalance,
            burnWeight,
            tickets,
            pendingDiv,
            totalClaimed
        ] = await Promise.all([
            tokenContract.balanceOf(currentAccount),
            burnPoolContract.burnWeight(currentAccount),
            burnPoolContract.tickets(currentAccount),
            burnPoolContract.pendingDividend(currentAccount),
            getTotalClaimedDividend(currentAccount)
        ]);

        updateUserUI({
            userBalance,
            burnWeight,
            tickets,
            pendingDiv,
            totalClaimed
        });

    } catch (e) {
        console.error('刷新用户数据失败:', e);
    }
}

async function refreshPoolData() {
    if (!burnPoolContract) await initContracts();
    
    try {
        const wbnbBalance = await burnPoolContract.getWBNBBalance();
        const dividendPoolEl = document.getElementById('dividendPool');
        if (dividendPoolEl) {
            dividendPoolEl.innerText = formatAmount(wbnbBalance, 18, 4) + ' WBNB';
        }
    } catch (e) {
        console.error('刷新奖池数据失败:', e);
    }
}

async function refreshRoundData() {
    if (!burnPoolContract) await initContracts();
    
    try {
        const roundId = await burnPoolContract.roundId();
        
        if (roundId > 0) {
            const currentRoundInfo = await burnPoolContract.getCurrentRoundInfo();
            updateRoundUI(currentRoundInfo);
        } else {
            resetRoundUI();
        }
        
        updateActionButtons();
        
    } catch (e) {
        console.error('刷新轮次数据失败:', e);
    }
}

// ==================== UI 更新函数 ====================
function updateUserUI(data) {
    const { userBalance, burnWeight, tickets, pendingDiv, totalClaimed } = data;
    
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
    if (claimableAmountEl) claimableAmountEl.innerText = formatAmount(pendingDiv, 18, 6) + ' WBNB';
    
    const totalDividendEl = document.getElementById('totalDividend');
    if (totalDividendEl) totalDividendEl.innerText = formatAmount(totalClaimed, 18, 6) + ' WBNB';
    
    updateDailyDividendEstimate(burnWeight);
}

function clearUserUI() {
    const elements = ['userBalance', 'burnPoints', 'burnWeight', 'totalBurned', 'myTicketCount'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '0';
    });
    
    const claimableAmountEl = document.getElementById('claimableAmount');
    if (claimableAmountEl) claimableAmountEl.innerText = '0 WBNB';
    
    const totalDividendEl = document.getElementById('totalDividend');
    if (totalDividendEl) totalDividendEl.innerText = '0 WBNB';
}

function updateRoundUI(roundInfo) {
    const currentRoundEl = document.getElementById('currentRound');
    if (currentRoundEl) currentRoundEl.innerText = roundInfo.roundId;
    
    const jackpotAmountEl = document.getElementById('jackpotAmount');
    if (jackpotAmountEl) jackpotAmountEl.innerText = formatAmount(roundInfo.prizePool, tokenDecimals) + ' AI币';
    
    const roundPoolDisplayEl = document.getElementById('roundPoolDisplay');
    if (roundPoolDisplayEl) roundPoolDisplayEl.innerText = formatAmount(roundInfo.prizePool, tokenDecimals) + ' AI币';
    
    // 修复：票数显示真实值（处理18位精度）
    const totalTicketsDisplayEl = document.getElementById('totalTicketsDisplay');
    if (totalTicketsDisplayEl) {
        // 将18位精度的票数转换为真实票数
        const realTickets = roundInfo.totalTickets.div(ethers.BigNumber.from(10).pow(18));
        totalTicketsDisplayEl.innerText = realTickets.toString();
    }
    
    const participantCountEl = document.getElementById('participantCount');
    if (participantCountEl) {
        // 将18位精度的票数转换为真实票数
        const realTickets = roundInfo.totalTickets.div(ethers.BigNumber.from(10).pow(18));
        participantCountEl.innerText = realTickets.toString();
    }
    
    const roundStatusEl = document.getElementById('roundStatus');
    if (roundStatusEl) {
        if (roundInfo.drawn) {
            roundStatusEl.innerText = '已开奖';
            roundStatusEl.className = 'round-status-badge status-drawn';
        } else if (Date.now() / 1000 >= roundInfo.endTime) {
            roundStatusEl.innerText = '可开奖';
            roundStatusEl.className = 'round-status-badge status-pending';
        } else {
            roundStatusEl.innerText = '进行中';
            roundStatusEl.className = 'round-status-badge status-active';
        }
    }
    
    updateCountdown(roundInfo.endTime, roundInfo.drawn);
}

function resetRoundUI() {
    const elements = {
        'currentRound': '0',
        'jackpotAmount': '0 AI币',
        'roundPoolDisplay': '0 AI币',
        'totalTicketsDisplay': '0',
        'participantCount': '0'
    };
    
    Object.entries(elements).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    });
}

function updateActionButtons() {
    // 购买按钮
    const buyBtn = document.getElementById('buyBtn');
    if (buyBtn) {
        if (!isConnected) {
            buyBtn.disabled = true;
            buyBtn.innerText = '请先连接钱包';
        } else {
            buyBtn.disabled = false;
            buyBtn.innerText = '确认购买';
        }
    }
    
    // 修复：燃烧按钮文字 - 未连接时显示"开始燃烧"
    const burnButton = document.getElementById('burnButton');
    if (burnButton) {
        burnButton.disabled = !isConnected;
        burnButton.innerText = isConnected ? '开始燃烧' : '开始燃烧';
    }
    
    // 修复：领取分红按钮文字 - 未连接时显示"领取分红"
    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.disabled = !isConnected;
        claimButton.innerText = isConnected ? '领取分红' : '领取分红';
    }
}

// ==================== 业务逻辑函数 ====================
async function getTotalClaimedDividend(userAddress) {
    if (!burnPoolContract || !userAddress) return ethers.BigNumber.from(0);
    
    try {
        const filter = burnPoolContract.filters.DividendClaimed(userAddress);
        const events = await burnPoolContract.queryFilter(filter, 0, 'latest');
        
        let total = ethers.BigNumber.from(0);
        events.forEach(event => {
            total = total.add(event.args.wbnbAmount);
        });
        return total;
    } catch (e) {
        return ethers.BigNumber.from(0);
    }
}

async function estimateDailyDividend(userBurnWeight) {
    if (!burnPoolContract || !userBurnWeight || userBurnWeight.eq(0)) return '0';
    
    try {
        const [totalWeight, pendingTax] = await Promise.all([
            burnPoolContract.totalBurnWeight(),
            burnPoolContract.pendingTax()
        ]);
        
        if (totalWeight.eq(0)) return '0';
        
        const dailyTax = pendingTax.mul(2);
        const userShare = dailyTax.mul(userBurnWeight).div(totalWeight);
        
        return formatAmount(userShare, 18, 6);
    } catch (e) {
        return '0';
    }
}

async function updateDailyDividendEstimate(burnWeight) {
    const dailyDividendEl = document.getElementById('dailyDividend');
    if (!dailyDividendEl) return;
    
    const estimate = await estimateDailyDividend(burnWeight);
    dailyDividendEl.innerText = estimate + ' WBNB';
}

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

// ==================== 合约交互函数 ====================
async function buyTickets(ticketCount) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    const amount = ticketCount * 100;
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.burnPoolAddress);
        
        if (allowance.lt(amountWei)) {
            showToast('正在授权代币...', 2000);
            const txApprove = await tokenContract.approve(CONFIG.burnPoolAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
            showToast('授权成功', 2000);
        }

        const tx = await burnPoolContract.buyTicket(amountWei);
        showToast('交易已发送，等待确认...', 3000);
        await tx.wait();
        
        showToast('购买成功！');
        await refreshAllData();
        await loadRoundHistory();
        
    } catch (e) {
        console.error('购买失败:', e);
        showToast('购买失败: ' + (e.reason || e.message));
    }
}

async function burnTokens(amountStr) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效数量');
        return;
    }
    
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.burnPoolAddress);
        
        if (allowance.lt(amountWei)) {
            showToast('正在授权代币...', 2000);
            const txApprove = await tokenContract.approve(CONFIG.burnPoolAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
            showToast('授权成功', 2000);
        }

        const tx = await burnPoolContract.burnForDividend(amountWei);
        showToast('燃烧交易已发送...');
        await tx.wait();
        
        showToast('燃烧成功！获得分红权重');
        await refreshAllData();
        await loadBurnRank();
        
    } catch (e) {
        console.error('燃烧失败:', e);
        showToast('燃烧失败: ' + (e.reason || e.message));
    }
}

async function claimDividend() {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    try {
        const pendingDiv = await burnPoolContract.pendingDividend(currentAccount);
        
        if (pendingDiv.eq(0)) {
            showToast('没有可领取的分红');
            return;
        }
        
        const tx = await burnPoolContract.claimTaxDividend();
        showToast('领取交易已发送...');
        await tx.wait();
        
        showToast('领取成功！');
        await refreshAllData();
        
    } catch (e) {
        console.error('领取失败:', e);
        showToast('领取失败: ' + (e.reason || e.message));
    }
}

async function drawRound(roundId) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    try {
        const tx = await burnPoolContract.drawRound(roundId);
        showToast('开奖交易已发送...');
        await tx.wait();
        
        showToast('开奖成功！');
        await refreshAllData();
        await loadRoundHistory();
        
    } catch (e) {
        console.error('开奖失败:', e);
        showToast('开奖失败: ' + (e.reason || e.message));
    }
}

async function claimPrize(roundId) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    try {
        const tx = await burnPoolContract.claimPrize(roundId);
        showToast('领取交易已发送...');
        await tx.wait();
        
        showToast('领取成功！');
        await refreshAllData();
        await loadRoundHistory();
        
    } catch (e) {
        console.error('领取失败:', e);
        showToast('领取失败: ' + (e.reason || e.message));
    }
}

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
            const tx = await burnPoolContract.claimPrize(r.roundId);
            await tx.wait();
            successCount++;
        } catch (e) {
            console.error(`轮次 ${r.roundId} 领取失败`, e);
        }
    }
    
    showToast(`成功领取 ${successCount} 个轮次！`);
    await refreshAllData();
    await loadRoundHistory();
}

// ==================== 数据加载函数 ====================
async function loadRoundHistory() {
    if (!burnPoolContract) await initContracts();
    
    const historyDiv = document.getElementById('historyList');
    const claimAllBtn = document.getElementById('claimAllBtn');
    
    if (!historyDiv) return;

    try {
        const roundId = await burnPoolContract.roundId();
        if (roundId === 0) {
            historyDiv.innerHTML = '<div class="empty-history">暂无历史记录</div>';
            if (claimAllBtn) claimAllBtn.style.display = 'none';
            return;
        }

        let html = '';
        let hasUnclaimed = false;
        userRounds = [];

        const start = roundId > 10 ? roundId - 9 : 1;
        
        for (let i = roundId; i >= start; i--) {
            try {
                const info = await burnPoolContract.getRoundInfo(i);
                
                if (!info.drawn) continue;
                
                const winners = info.winners;
                const prizePool = info.prizePool;

                let userWon = false;
                let userUnclaimedCount = 0;

                if (currentAccount) {
                    try {
                        const userInfo = await burnPoolContract.getUserPrizeInfo(i, currentAccount);
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

async function loadBurnRank() {
    if (!burnPoolContract) await initContracts();
    
    const rankList = document.getElementById('rankList');
    if (!rankList) return;

    try {
        const filter = burnPoolContract.filters.Burn();
        const events = await burnPoolContract.queryFilter(filter, 0, 'latest');
        
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
        
        const sortedBurns = Array.from(burnMap.entries())
            .sort((a, b) => b[1].cmp(a[1]))
            .slice(0, 20);
        
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

async function updateWinChance() {
    if (!currentAccount || !burnPoolContract) return;
    
    try {
        const [tickets, currentRoundInfo] = await Promise.all([
            burnPoolContract.tickets(currentAccount),
            burnPoolContract.getCurrentRoundInfo()
        ]);
        
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

async function updateDailyDividend(burnAmount) {
    const dailyDividendEl = document.getElementById('dailyDividend');
    if (!dailyDividendEl || !burnPoolContract) return;
    
    try {
        const amount = parseFloat(burnAmount) || 0;
        if (amount === 0) {
            dailyDividendEl.innerText = '0 WBNB';
            return;
        }
        
        const amountWei = parseAmount(amount.toString(), tokenDecimals);
        const estimate = await estimateDailyDividend(amountWei);
        dailyDividendEl.innerText = estimate + ' WBNB';
    } catch (e) {
        dailyDividendEl.innerText = '0 WBNB';
    }
}

// ==================== 导出 API ====================
window.ContractAPI = {
    connectWallet,
    disconnectWallet,
    refreshData: refreshAllData,
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
    getBurnPoolContract: () => burnPoolContract,
    getTokenContract: () => tokenContract,
    getProvider: () => provider,
    getSigner: () => signer,
    getCurrentAccount: () => currentAccount,
    isWalletConnected: () => isConnected
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initContracts();
        await refreshAllData();
        await loadRoundHistory();
        
        setInterval(() => {
            const homePage = document.getElementById('homePage');
            if (homePage?.classList.contains('active')) {
                refreshAllData();
            }
        }, 30000);
        
    } catch (e) {
        console.error('初始化失败:', e);
    }
});
