// contract.js - SwimLotteryPure 合约对接配置
// 请替换以下地址为你部署的真实合约地址

const CONFIG = {
    // BSC主网配置（测试网改为97）
    CHAIN_ID: 56,
    RPC_URL: 'https://bsc-dataseed.binance.org/',
    
    // !!! 重要：替换为你的合约地址 !!!
    CONTRACTS: {
        LOTTERY: '0xYourLotteryContractAddressHere',  // SwimLotteryPure合约地址
    },
    
    // 合约完整ABI
    ABI: {
        LOTTERY: [
            "function burnForDividend(uint256 amount) external",
            "function buyTicket(uint256 amount) external",
            "function claimTaxDividend() external",
            "function claimPrize(uint256 _roundId) external",
            "function drawRound(uint256 _roundId) external",
            "function syncTax() external",
            "function getContractStats() external view returns (uint256 _totalStaked, uint256 _totalBurnWeight, uint256 _pendingTax, uint256 _totalTaxDistributed, uint256 _currentRound, uint256 _contractBalance, bool _paused)",
            "function getCurrentRoundInfo() external view returns (uint256 _roundId, uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, uint256 timeRemaining, bool canDraw, uint256 participantCount, uint256 targetDrawBlock)",
            "function getUserInfo(address user) external view returns (uint256 burnWeight_, uint256 pendingDividend_, uint256 totalTickets_, uint256 currentRoundTickets)",
            "function pendingDividend(address user) external view returns (uint256)",
            "function rounds(uint256) view returns (uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, uint256 startBlock)",
            "function token() view returns (address)",
            "function tokenSet() view returns (bool)",
            "function roundId() view returns (uint256)",
            "function totalStaked() view returns (uint256)",
            "function totalBurnWeight() view returns (uint256)",
            "function pendingTax() view returns (uint256)",
            "function burnWeight(address) view returns (uint256)",
            "function userTotalTickets(address) view returns (uint256)",
            "event Burn(address indexed user, uint256 amount, uint256 totalWeight)",
            "event TicketBought(address indexed user, uint256 amount, uint256 roundId, uint256 ticketIndex)",
            "event DividendClaimed(address indexed user, uint256 amount, uint256 remainingDebt)",
            "event NewRound(uint256 indexed roundId, uint256 prizePool, uint256 startTime, uint256 endTime, uint256 startBlock)",
            "event RoundDrawn(uint256 indexed roundId, address[] winners, uint256[] shares, uint256 randomSeed, uint256 blockNumber)",
            "event PrizeClaimed(address indexed user, uint256 indexed roundId, uint256 amount)"
        ],
        TOKEN: [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function balanceOf(address account) external view returns (uint256)",
            "function transfer(address recipient, uint256 amount) external returns (bool)",
            "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
            "function decimals() external view returns (uint8)",
            "function symbol() external view returns (string memory)"
        ]
    },
    
    TOKEN_DECIMALS: 18,
    TICKET_PRICE: 100  // 100 AI币/张
};

// 全局状态
const AppState = {
    provider: null,
    signer: null,
    userAddress: null,
    contracts: {},
    isConnected: false,
    currentRound: {
        roundId: 0,
        endTime: 0,
        prizePool: 0,
        totalTickets: 0,
        timeRemaining: 0
    },
    userData: {
        balance: 0,
        burnWeight: 0,
        pendingDividend: 0,
        currentRoundTickets: 0
    }
};

// ContractAPI 暴露给HTML调用
const ContractAPI = {
    // 连接钱包
    connectWallet: async function() {
        try {
            if (!window.ethereum) {
                alert('请安装MetaMask钱包');
                return;
            }

            const btn = document.getElementById('connectBtn');
            btn.textContent = '连接中...';
            btn.disabled = true;

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            AppState.provider = new ethers.providers.Web3Provider(window.ethereum);
            AppState.signer = AppState.provider.getSigner();
            AppState.userAddress = accounts[0];
            AppState.isConnected = true;

            // 初始化合约
            await this.initContracts();

            // 更新UI
            this.updateWalletUI();
            
            // 加载数据
            await this.refreshData();

            // 监听事件
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) location.reload();
                else {
                    AppState.userAddress = accounts[0];
                    this.updateWalletUI();
                    this.refreshData();
                }
            });

            window.ethereum.on('chainChanged', () => location.reload());

        } catch (error) {
            console.error('连接失败:', error);
            alert('连接失败: ' + error.message);
            document.getElementById('connectBtn').textContent = '连接钱包';
            document.getElementById('connectBtn').disabled = false;
        }
    },

    // 初始化合约
    initContracts: async function() {
        AppState.contracts.lottery = new ethers.Contract(
            CONFIG.CONTRACTS.LOTTERY,
            CONFIG.ABI.LOTTERY,
            AppState.signer
        );

        // 获取代币地址
        const tokenAddress = await AppState.contracts.lottery.token();
        AppState.contracts.token = new ethers.Contract(
            tokenAddress,
            CONFIG.ABI.TOKEN,
            AppState.signer
        );
    },

    // 刷新所有数据
    refreshData: async function() {
        if (!AppState.isConnected) return;

        try {
            // 1. 获取合约统计
            const stats = await AppState.contracts.lottery.getContractStats();
            const totalStaked = parseFloat(ethers.utils.formatUnits(stats._totalStaked, 18));
            const pendingTax = parseFloat(ethers.utils.formatUnits(stats._pendingTax, 18));
            
            // 更新UI - AI奖池是totalStaked，分红奖池是pendingTax
            document.getElementById('jackpotAmount').textContent = totalStaked.toFixed(2);
            document.getElementById('dividendPool').textContent = pendingTax.toFixed(2);

            // 2. 获取当前轮次
            const roundInfo = await AppState.contracts.lottery.getCurrentRoundInfo();
            AppState.currentRound = {
                roundId: roundInfo._roundId.toNumber(),
                endTime: roundInfo.endTime.toNumber(),
                prizePool: parseFloat(ethers.utils.formatUnits(roundInfo.prizePool, 18)),
                totalTickets: parseFloat(ethers.utils.formatUnits(roundInfo.totalTickets, 18)),
                timeRemaining: roundInfo.timeRemaining.toNumber(),
                drawn: roundInfo.drawn
            };

            document.getElementById('roundPool').textContent = AppState.currentRound.prizePool.toFixed(2);

            // 3. 获取用户信息
            const userInfo = await AppState.contracts.lottery.getUserInfo(AppState.userAddress);
            AppState.userData.burnWeight = parseFloat(ethers.utils.formatUnits(userInfo.burnWeight_, 18));
            AppState.userData.pendingDividend = parseFloat(ethers.utils.formatUnits(userInfo.pendingDividend_, 18));
            AppState.userData.currentRoundTickets = parseFloat(ethers.utils.formatUnits(userInfo.currentRoundTickets, 18));

            // 更新UI
            document.getElementById('burnPoints').textContent = AppState.userData.burnWeight.toFixed(2);
            document.getElementById('myTicketCount').textContent = AppState.userData.currentRoundTickets.toString();
            document.getElementById('claimableAmount').textContent = AppState.userData.pendingDividend.toFixed(4);
            document.getElementById('totalBurned').textContent = AppState.userData.burnWeight.toFixed(2) + ' AI币';

            // 4. 获取代币余额
            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            const bal = parseFloat(ethers.utils.formatUnits(balance, 18));
            document.getElementById('userBalance').textContent = bal.toFixed(2);

            // 更新按钮状态
            this.updateButtonStates();
            
            // 更新概率显示
            this.updateWinChance();

        } catch (error) {
            console.error('刷新数据失败:', error);
        }
    },

    // 购买彩票
    buyTickets: async function(ticketCount) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            // 计算代币数量（100 AI币/张）
            const tokenAmount = ethers.utils.parseUnits(
                (ticketCount * CONFIG.TICKET_PRICE).toString(),
                18
            );

            // 检查余额
            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(tokenAmount)) {
                alert('AI币余额不足');
                return;
            }

            // 检查并授权
            const allowance = await AppState.contracts.token.allowance(
                AppState.userAddress,
                CONFIG.CONTRACTS.LOTTERY
            );

            if (allowance.lt(tokenAmount)) {
                alert('请先授权合约使用您的代币');
                const approveTx = await AppState.contracts.token.approve(
                    CONFIG.CONTRACTS.LOTTERY,
                    ethers.constants.MaxUint256
                );
                await approveTx.wait();
            }

            // 购买
            const tx = await AppState.contracts.lottery.buyTicket(tokenAmount);
            await tx.wait();
            
            alert('购买成功！');
            await this.refreshData();

        } catch (error) {
            console.error('购买失败:', error);
            let msg = error.message;
            if (error.data?.message) msg = error.data.message;
            if (msg.includes('Round ended')) msg = '本期已结束，等待开奖';
            if (msg.includes('No existing stake')) msg = '合约尚未启动，请先燃烧代币或等待';
            alert('购买失败: ' + msg);
        }
    },

    // 燃烧代币
    burnTokens: async function(amount) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const burnAmount = ethers.utils.parseUnits(amount.toString(), 18);

            // 检查余额
            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(burnAmount)) {
                alert('AI币余额不足');
                return;
            }

            // 检查并授权
            const allowance = await AppState.contracts.token.allowance(
                AppState.userAddress,
                CONFIG.CONTRACTS.LOTTERY
            );

            if (allowance.lt(burnAmount)) {
                alert('请先授权合约使用您的代币');
                const approveTx = await AppState.contracts.token.approve(
                    CONFIG.CONTRACTS.LOTTERY,
                    ethers.constants.MaxUint256
                );
                await approveTx.wait();
            }

            const tx = await AppState.contracts.lottery.burnForDividend(burnAmount);
            await tx.wait();
            
            alert('燃烧成功！获得分红权重');
            await this.refreshData();

        } catch (error) {
            console.error('燃烧失败:', error);
            alert('燃烧失败: ' + (error.data?.message || error.message));
        }
    },

    // 领取分红
    claimDividend: async function() {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const claimable = await AppState.contracts.lottery.pendingDividend(AppState.userAddress);
            if (claimable.eq(0)) {
                alert('没有可领取的分红');
                return;
            }

            const tx = await AppState.contracts.lottery.claimTaxDividend();
            await tx.wait();
            
            alert('领取成功！');
            await this.refreshData();

        } catch (error) {
            console.error('领取失败:', error);
            alert('领取失败: ' + (error.data?.message || error.message));
        }
    },

    // 更新钱包UI
    updateWalletUI: function() {
        const statusDiv = document.getElementById('walletStatus');
        const shortAddr = AppState.userAddress.slice(0, 6) + '...' + AppState.userAddress.slice(-4);
        statusDiv.innerHTML = `
            <span class="address-tag">${shortAddr}</span>
            <button class="refresh-btn" id="refreshBtn">🔄 刷新</button>
        `;
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
    },

    // 更新按钮状态
    updateButtonStates: function() {
        const buyBtn = document.getElementById('buyBtn');
        const burnBtn = document.getElementById('burnButton');
        const claimBtn = document.getElementById('claimButton');

        if (AppState.isConnected) {
            buyBtn.disabled = false;
            buyBtn.textContent = '确认购买';
            burnBtn.disabled = false;
            burnBtn.textContent = '确认燃烧';
            
            const hasDividend = AppState.userData.pendingDividend > 0;
            claimBtn.disabled = !hasDividend;
            claimBtn.textContent = hasDividend ? '立即领取' : '无可领取分红';
        }
    },

    // 更新中奖概率
    updateWinChance: function() {
        const ticketInput = document.getElementById('ticketAmount');
        if (!ticketInput) return;
        
        const ticketCount = parseInt(ticketInput.value) || 0;
        const myTokens = ticketCount * CONFIG.TICKET_PRICE;
        const totalTokens = AppState.currentRound.totalTickets;
        
        if (totalTokens > 0) {
            const probability = (myTokens / (totalTokens + myTokens) * 100).toFixed(2);
            document.getElementById('winChance').textContent = probability + '%';
        } else {
            document.getElementById('winChance').textContent = '0%';
        }
    },

    // 更新预计每日分红（简化计算）
    updateDailyDividend: function(burnAmount) {
        const totalWeight = parseFloat(document.getElementById('burnPoints').textContent) + parseFloat(burnAmount);
        const pendingTax = parseFloat(document.getElementById('dividendPool').textContent);
        
        if (totalWeight > 0 && pendingTax > 0) {
            // 假设每日释放10%的pendingTax（按合约设计）
            const dailyRelease = pendingTax * 0.1;
            const myShare = (burnAmount / totalWeight) * dailyRelease;
            document.getElementById('dailyDividend').textContent = myShare.toFixed(4);
        }
    },

    // 获取倒计时
    getCountdown: function() {
        if (!AppState.isConnected || !AppState.currentRound.endTime) return;
        
        const now = Math.floor(Date.now() / 1000);
        const remaining = AppState.currentRound.endTime - now;
        
        if (remaining > 0) {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            document.getElementById('countdown').textContent = 
                `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        } else {
            document.getElementById('countdown').textContent = '等待开奖';
        }
    }
};
