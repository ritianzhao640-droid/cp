// contract.js - 修复ENS错误 (最终版)

// 强制清除缓存：在URL后加 ?v=2
const CONFIG = {
    CHAIN_ID: 56,
    RPC_URL: 'https://bsc-dataseed.binance.org/',
    
    CONTRACTS: {
        LOTTERY: '0xYourLotteryContractAddressHere',  // 必须改成你的真实合约地址！
    },
    
    ABI: {
        LOTTERY: [
            "function burnForDividend(uint256 amount) external",
            "function buyTicket(uint256 amount) external",
            "function claimTaxDividend() external",
            "function claimPrize(uint256 _roundId) external",
            "function drawRound(uint256 _roundId) external",
            "function getContractStats() external view returns (uint256 _totalStaked, uint256 _totalBurnWeight, uint256 _pendingTax, uint256 _totalTaxDistributed, uint256 _currentRound, uint256 _contractBalance, bool _paused)",
            "function getCurrentRoundInfo() external view returns (uint256 _roundId, uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, uint256 timeRemaining, bool canDraw, uint256 participantCount, uint256 targetDrawBlock)",
            "function getUserInfo(address user) external view returns (uint256 burnWeight_, uint256 pendingDividend_, uint256 totalTickets_, uint256 currentRoundTickets)",
            "function getRoundWinners(uint256 _roundId) external view returns (address[] memory winners, uint256[] memory shares)",
            "function pendingDividend(address user) external view returns (uint256)",
            "function rounds(uint256) view returns (uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, bool drawn, uint256 startBlock)",
            "function token() view returns (address)",
            "function hasClaimed(address,uint256) view returns (bool)",
            "event Burn(address indexed user, uint256 amount, uint256 totalWeight)",
            "event TicketBought(address indexed user, uint256 amount, uint256 roundId, uint256 ticketIndex)",
            "event DividendClaimed(address indexed user, uint256 amount, uint256 remainingDebt)",
            "event RoundDrawn(uint256 indexed roundId, address[] winners, uint256[] shares, uint256 randomSeed, uint256 blockNumber)"
        ],
        TOKEN: [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ]
    },
    
    TOKEN_DECIMALS: 18,
    TICKET_PRICE: 100
};

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
        timeRemaining: 0,
        drawn: false,
        canDraw: false,
        participantCount: 0
    },
    userData: {
        balance: 0,
        burnWeight: 0,
        pendingDividend: 0,
        currentRoundTickets: 0
    }
};

const ContractAPI = {
    connectWallet: async function() {
        try {
            if (!window.ethereum) {
                alert('请安装MetaMask钱包');
                return;
            }

            const btn = document.getElementById('connectBtn');
            if (btn) {
                btn.textContent = '连接中...';
                btn.disabled = true;
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // 关键修复：使用静态JSON-RPC provider，完全绕过ENS
            // 或者使用Web3Provider但确保禁用ENS
            const network = {
                name: 'bnb',
                chainId: 56,
                ensAddress: null  // 禁用ENS
            };
            
            AppState.provider = new ethers.providers.Web3Provider(window.ethereum, network);
            AppState.signer = AppState.provider.getSigner();
            AppState.userAddress = accounts[0];
            AppState.isConnected = true;

            console.log('钱包地址:', AppState.userAddress);
            
            // 检查网络
            const net = await AppState.provider.getNetwork();
            console.log('当前网络:', net);

            await this.initContracts();
            this.updateWalletUI();
            await this.refreshData();
            this.setupEventListeners();
            this.startAutoRefresh();

        } catch (error) {
            console.error('连接失败:', error);
            alert('连接失败: ' + error.message);
            const btn = document.getElementById('connectBtn');
            if (btn) {
                btn.textContent = '连接钱包';
                btn.disabled = false;
            }
        }
    },

    initContracts: async function() {
        try {
            // 确保地址是有效的以太坊地址（不是ENS域名）
            const lotteryAddress = ethers.utils.getAddress(CONFIG.CONTRACTS.LOTTERY);
            console.log('合约地址:', lotteryAddress);
            
            AppState.contracts.lottery = new ethers.Contract(
                lotteryAddress,
                CONFIG.ABI.LOTTERY,
                AppState.signer
            );

            const tokenAddress = await AppState.contracts.lottery.token();
            console.log('代币地址:', tokenAddress);
            
            // 同样确保token地址是校验过的
            const checkedTokenAddress = ethers.utils.getAddress(tokenAddress);
            
            AppState.contracts.token = new ethers.Contract(
                checkedTokenAddress,
                CONFIG.ABI.TOKEN,
                AppState.signer
            );

        } catch (error) {
            console.error('初始化合约失败:', error);
            throw error;
        }
    },

    refreshData: async function() {
        if (!AppState.isConnected) return;
        
        try {
            await Promise.all([
                this.refreshGlobalData(),
                this.refreshUserData(),
                this.refreshRoundInfo()
            ]);
            this.updateButtonStates();
        } catch (error) {
            console.error('刷新数据失败:', error);
        }
    },

    refreshGlobalData: async function() {
        try {
            const stats = await AppState.contracts.lottery.getContractStats();
            
            const totalStaked = parseFloat(ethers.utils.formatUnits(stats._totalStaked, 18));
            const pendingTax = parseFloat(ethers.utils.formatUnits(stats._pendingTax, 18));
            const totalTaxDistributed = parseFloat(ethers.utils.formatUnits(stats._totalTaxDistributed, 18));
            
            const jackpotEl = document.getElementById('jackpotAmount');
            const dividendEl = document.getElementById('dividendPool');
            const totalDistributedEl = document.getElementById('totalDistributed');
            
            if (jackpotEl) jackpotEl.textContent = totalStaked.toFixed(2);
            if (dividendEl) dividendEl.textContent = pendingTax.toFixed(2);
            if (totalDistributedEl) totalDistributedEl.textContent = totalTaxDistributed.toFixed(2);

        } catch (error) {
            console.error('刷新全局数据失败:', error);
        }
    },

    refreshUserData: async function() {
        try {
            const userInfo = await AppState.contracts.lottery.getUserInfo(AppState.userAddress);
            
            AppState.userData.burnWeight = parseFloat(ethers.utils.formatUnits(userInfo.burnWeight_, 18));
            AppState.userData.pendingDividend = parseFloat(ethers.utils.formatUnits(userInfo.pendingDividend_, 18));
            AppState.userData.currentRoundTickets = parseFloat(ethers.utils.formatUnits(userInfo.currentRoundTickets, 18));

            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            AppState.userData.balance = parseFloat(ethers.utils.formatUnits(balance, 18));

            const burnPointsEl = document.getElementById('burnPoints');
            const myTicketCountEl = document.getElementById('myTicketCount');
            const claimableEl = document.getElementById('claimableAmount');
            const totalBurnedEl = document.getElementById('totalBurned');
            const balanceEl = document.getElementById('userBalance');

            if (burnPointsEl) burnPointsEl.textContent = AppState.userData.burnWeight.toFixed(2);
            if (myTicketCountEl) myTicketCountEl.textContent = Math.floor(AppState.userData.currentRoundTickets).toString();
            if (claimableEl) claimableEl.textContent = AppState.userData.pendingDividend.toFixed(4);
            if (totalBurnedEl) totalBurnedEl.textContent = AppState.userData.burnWeight.toFixed(2) + ' AI币';
            if (balanceEl) balanceEl.textContent = AppState.userData.balance.toFixed(2);

        } catch (error) {
            console.error('刷新用户数据失败:', error);
        }
    },

    refreshRoundInfo: async function() {
        try {
            const roundInfo = await AppState.contracts.lottery.getCurrentRoundInfo();
            
            AppState.currentRound = {
                roundId: roundInfo._roundId.toNumber(),
                endTime: roundInfo.endTime.toNumber(),
                prizePool: parseFloat(ethers.utils.formatUnits(roundInfo.prizePool, 18)),
                totalTickets: parseFloat(ethers.utils.formatUnits(roundInfo.totalTickets, 18)),
                timeRemaining: roundInfo.timeRemaining.toNumber(),
                drawn: roundInfo.drawn,
                canDraw: roundInfo.canDraw,
                participantCount: roundInfo.participantCount.toNumber()
            };

            const roundPoolEl = document.getElementById('roundPool');
            const currentRoundEl = document.getElementById('currentRound');
            const participantCountEl = document.getElementById('participantCount');
            const roundStatusEl = document.getElementById('roundStatus');
            const roundPoolDisplayEl = document.getElementById('roundPoolDisplay');
            const totalTicketsDisplayEl = document.getElementById('totalTicketsDisplay');

            if (roundPoolEl) roundPoolEl.textContent = AppState.currentRound.prizePool.toFixed(2);
            if (currentRoundEl) currentRoundEl.textContent = AppState.currentRound.roundId;
            if (participantCountEl) participantCountEl.textContent = AppState.currentRound.participantCount;
            if (roundPoolDisplayEl) roundPoolDisplayEl.textContent = AppState.currentRound.prizePool.toFixed(0);
            if (totalTicketsDisplayEl) totalTicketsDisplayEl.textContent = Math.floor(AppState.currentRound.totalTickets);
            
            if (roundStatusEl) {
                if (AppState.currentRound.drawn) {
                    roundStatusEl.textContent = '已开奖';
                    roundStatusEl.className = 'round-status-badge status-drawn';
                } else if (AppState.currentRound.timeRemaining > 0) {
                    roundStatusEl.textContent = '进行中';
                    roundStatusEl.className = 'round-status-badge status-active';
                } else {
                    roundStatusEl.textContent = '等待开奖';
                    roundStatusEl.className = 'round-status-badge status-pending';
                }
            }

            const drawBtn = document.getElementById('drawBtn');
            const drawStatus = document.getElementById('drawStatus');
            if (drawBtn && drawStatus) {
                if (AppState.currentRound.drawn) {
                    drawBtn.textContent = '本期已开奖';
                    drawBtn.disabled = true;
                    drawBtn.className = 'draw-btn';
                    drawStatus.textContent = '等待下期开始';
                } else if (AppState.currentRound.canDraw) {
                    drawBtn.textContent = '立即开奖';
                    drawBtn.disabled = false;
                    drawBtn.className = 'draw-btn active';
                    drawStatus.textContent = '点击按钮触发开奖';
                } else {
                    drawBtn.textContent = '等待开奖';
                    drawBtn.disabled = true;
                    drawBtn.className = 'draw-btn';
                    drawStatus.textContent = `还需等待 ${Math.ceil(AppState.currentRound.timeRemaining / 60)} 分钟`;
                }
            }

        } catch (error) {
            console.error('刷新轮次信息失败:', error);
        }
    },

    buyTickets: async function(ticketCount) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const count = parseInt(ticketCount);
            if (!count || count <= 0) {
                alert('请输入有效的购票数量');
                return;
            }

            const tokenAmount = ethers.utils.parseUnits((count * CONFIG.TICKET_PRICE).toString(), 18);

            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(tokenAmount)) {
                alert(`AI币余额不足，需要 ${count * CONFIG.TICKET_PRICE} AI币`);
                return;
            }

            const allowance = await AppState.contracts.token.allowance(AppState.userAddress, CONFIG.CONTRACTS.LOTTERY);

            if (allowance.lt(tokenAmount)) {
                const approveConfirmed = confirm('需要先授权合约使用您的代币，是否继续？');
                if (!approveConfirmed) return;

                const approveTx = await AppState.contracts.token.approve(CONFIG.CONTRACTS.LOTTERY, ethers.constants.MaxUint256);
                await approveTx.wait();
                alert('授权成功！');
            }

            const buyBtn = document.getElementById('buyBtn');
            if (buyBtn) {
                buyBtn.textContent = '确认中...';
                buyBtn.disabled = true;
            }

            const tx = await AppState.contracts.lottery.buyTicket(tokenAmount);
            await tx.wait();
            
            alert(`成功购买 ${count} 张彩票！`);
            await this.refreshData();

        } catch (error) {
            console.error('购买失败:', error);
            let msg = error.message;
            if (error.data?.message) msg = error.data.message;
            alert('购买失败: ' + msg);
        } finally {
            const buyBtn = document.getElementById('buyBtn');
            if (buyBtn) {
                buyBtn.textContent = '确认购买';
                buyBtn.disabled = false;
            }
        }
    },

    burnTokens: async function(amount) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const burnAmount = parseFloat(amount);
            if (!burnAmount || burnAmount <= 0) {
                alert('请输入有效的燃烧数量');
                return;
            }

            const burnAmountWei = ethers.utils.parseUnits(amount.toString(), 18);

            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(burnAmountWei)) {
                alert('AI币余额不足');
                return;
            }

            const allowance = await AppState.contracts.token.allowance(AppState.userAddress, CONFIG.CONTRACTS.LOTTERY);

            if (allowance.lt(burnAmountWei)) {
                const approveConfirmed = confirm('需要先授权合约使用您的代币，是否继续？');
                if (!approveConfirmed) return;

                await (await AppState.contracts.token.approve(CONFIG.CONTRACTS.LOTTERY, ethers.constants.MaxUint256)).wait();
                alert('授权成功！');
            }

            const tx = await AppState.contracts.lottery.burnForDividend(burnAmountWei);
            await tx.wait();
            
            alert(`成功燃烧 ${amount} AI币！`);
            await this.refreshData();

        } catch (error) {
            console.error('燃烧失败:', error);
            alert('燃烧失败: ' + (error.data?.message || error.message));
        }
    },

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
            
            const amount = ethers.utils.formatUnits(claimable, 18);
            alert(`成功领取 ${amount} AI币 分红！`);
            await this.refreshData();

        } catch (error) {
            console.error('领取失败:', error);
            alert('领取失败: ' + (error.data?.message || error.message));
        }
    },

    drawRound: async function(roundId) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const tx = await AppState.contracts.lottery.drawRound(roundId);
            await tx.wait();
            
            alert(`🎉 第 ${roundId} 期开奖成功！`);
            await this.refreshData();

        } catch (error) {
            console.error('开奖失败:', error);
            alert('开奖失败: ' + (error.data?.message || error.message));
        }
    },

    claimPrize: async function(roundId) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const tx = await AppState.contracts.lottery.claimPrize(roundId);
            await tx.wait();
            
            alert('领奖成功！');
            await this.refreshData();

        } catch (error) {
            console.error('领奖失败:', error);
            alert('领奖失败: ' + (error.data?.message || error.message));
        }
    },

    updateWalletUI: function() {
        const statusDiv = document.getElementById('walletStatus');
        if (!statusDiv) return;
        
        const shortAddr = AppState.userAddress.slice(0, 6) + '...' + AppState.userAddress.slice(-4);
        statusDiv.innerHTML = `
            <span class="address-tag">${shortAddr}</span>
            <button class="refresh-btn" onclick="ContractAPI.refreshData()">🔄</button>
        `;
        
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.style.display = 'inline-block';
    },

    updateButtonStates: function() {
        const buyBtn = document.getElementById('buyBtn');
        const burnBtn = document.getElementById('burnButton');
        const claimBtn = document.getElementById('claimButton');

        if (AppState.isConnected) {
            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.textContent = '确认购买';
            }
            if (burnBtn) {
                burnBtn.disabled = false;
                burnBtn.textContent = '确认燃烧';
            }
            if (claimBtn) {
                const hasDividend = AppState.userData.pendingDividend > 0;
                claimBtn.disabled = !hasDividend;
                claimBtn.textContent = hasDividend ? '立即领取' : '无可领取分红';
            }
        }
    },

    setupEventListeners: function() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) location.reload();
            else {
                AppState.userAddress = accounts[0];
                this.updateWalletUI();
                this.refreshData();
            }
        });
        window.ethereum.on('chainChanged', () => location.reload());
    },

    startAutoRefresh: function() {
        setInterval(() => {
            if (AppState.currentRound.endTime > 0) {
                const now = Math.floor(Date.now() / 1000);
                const remaining = AppState.currentRound.endTime - now;
                
                const countdownEl = document.getElementById('countdown');
                if (countdownEl) {
                    if (remaining > 0) {
                        const mins = Math.floor(remaining / 60);
                        const secs = remaining % 60;
                        countdownEl.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
                    } else {
                        countdownEl.textContent = '00:00';
                    }
                }
            }
        }, 1000);
        
        setInterval(() => this.refreshData(), 30000);
    }
};

window.ContractAPI = ContractAPI;
window.CONFIG = CONFIG;
