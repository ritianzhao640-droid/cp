// contract.js - SwimLotteryPure 合约对接配置 (修复版)

const CONFIG = {
    // BSC主网配置（测试网改为97）
    CHAIN_ID: 56,
    RPC_URL: 'https://bsc-dataseed.binance.org/',
    
    // !!! 重要：替换为你的合约地址 !!!
    CONTRACTS: {
        LOTTERY: '0xYourLotteryContractAddressHere',  // 这里必须改成你的真实合约地址！
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
            "function getRoundWinners(uint256 _roundId) external view returns (address[] memory winners, uint256[] memory shares)",
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
            "function userRoundTickets(address,uint256) view returns (uint256)",
            "function hasClaimed(address,uint256) view returns (bool)",
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
    TICKET_PRICE: 100,
    ROUND_DURATION: 1800
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
        timeRemaining: 0,
        drawn: false,
        canDraw: false,
        participantCount: 0
    },
    userData: {
        balance: 0,
        burnWeight: 0,
        pendingDividend: 0,
        currentRoundTickets: 0,
        totalTickets: 0
    },
    historyRounds: [],
    isRefreshing: false
};

// ContractAPI
const ContractAPI = {
    // 连接钱包
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
            
            // 关键修复：禁用ENS解析
            AppState.provider = new ethers.providers.Web3Provider(window.ethereum, {
                name: 'bnb',
                chainId: 56,
                ensAddress: null
            });
            
            AppState.signer = AppState.provider.getSigner();
            AppState.userAddress = accounts[0];
            AppState.isConnected = true;

            // 检查网络
            const network = await AppState.provider.getNetwork();
            console.log('当前网络:', network);
            
            if (network.chainId !== 56 && network.chainId !== 97) {
                alert('请切换到BSC主网或测试网');
                throw new Error('网络错误');
            }

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

    // 初始化合约
    initContracts: async function() {
        try {
            AppState.contracts.lottery = new ethers.Contract(
                CONFIG.CONTRACTS.LOTTERY,
                CONFIG.ABI.LOTTERY,
                AppState.signer
            );

            const tokenAddress = await AppState.contracts.lottery.token();
            console.log('代币地址:', tokenAddress);
            
            AppState.contracts.token = new ethers.Contract(
                tokenAddress,
                CONFIG.ABI.TOKEN,
                AppState.signer
            );

        } catch (error) {
            console.error('初始化合约失败:', error);
            throw error;
        }
    },

    // 刷新所有数据
    refreshData: async function() {
        if (!AppState.isConnected || AppState.isRefreshing) return;
        
        AppState.isRefreshing = true;
        
        try {
            await Promise.all([
                this.refreshGlobalData(),
                this.refreshUserData(),
                this.refreshRoundInfo()
            ]);
            
            this.updateButtonStates();
            this.updateWinChance();
            
        } catch (error) {
            console.error('刷新数据失败:', error);
        } finally {
            AppState.isRefreshing = false;
        }
    },

    // 刷新全局数据
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

    // 刷新用户数据
    refreshUserData: async function() {
        try {
            const userInfo = await AppState.contracts.lottery.getUserInfo(AppState.userAddress);
            
            AppState.userData.burnWeight = parseFloat(ethers.utils.formatUnits(userInfo.burnWeight_, 18));
            AppState.userData.pendingDividend = parseFloat(ethers.utils.formatUnits(userInfo.pendingDividend_, 18));
            AppState.userData.currentRoundTickets = parseFloat(ethers.utils.formatUnits(userInfo.currentRoundTickets, 18));
            AppState.userData.totalTickets = parseFloat(ethers.utils.formatUnits(userInfo.totalTickets_, 18));

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

    // 刷新轮次信息
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

    // 购买彩票
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

            const tokenAmount = ethers.utils.parseUnits(
                (count * CONFIG.TICKET_PRICE).toString(),
                18
            );

            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(tokenAmount)) {
                alert(`AI币余额不足，需要 ${count * CONFIG.TICKET_PRICE} AI币`);
                return;
            }

            const allowance = await AppState.contracts.token.allowance(
                AppState.userAddress,
                CONFIG.CONTRACTS.LOTTERY
            );

            if (allowance.lt(tokenAmount)) {
                const approveConfirmed = confirm('需要先授权合约使用您的代币，是否继续？');
                if (!approveConfirmed) return;

                const approveTx = await AppState.contracts.token.approve(
                    CONFIG.CONTRACTS.LOTTERY,
                    ethers.constants.MaxUint256
                );
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
            if (msg.includes('Round ended')) msg = '本期已结束，等待开奖';
            if (msg.includes('No existing stake')) msg = '合约尚未启动，请先燃烧代币激活';
            alert('购买失败: ' + msg);
        } finally {
            const buyBtn = document.getElementById('buyBtn');
            if (buyBtn) {
                buyBtn.textContent = '确认购买';
                buyBtn.disabled = false;
            }
        }
    },

    // 燃烧代币
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

            const allowance = await AppState.contracts.token.allowance(
                AppState.userAddress,
                CONFIG.CONTRACTS.LOTTERY
            );

            if (allowance.lt(burnAmountWei)) {
                const approveConfirmed = confirm('需要先授权合约使用您的代币，是否继续？');
                if (!approveConfirmed) return;

                const approveTx = await AppState.contracts.token.approve(
                    CONFIG.CONTRACTS.LOTTERY,
                    ethers.constants.MaxUint256
                );
                await approveTx.wait();
                alert('授权成功！');
            }

            const burnBtn = document.getElementById('burnButton');
            if (burnBtn) {
                burnBtn.textContent = '燃烧中...';
                burnBtn.disabled = true;
            }

            const tx = await AppState.contracts.lottery.burnForDividend(burnAmountWei);
            await tx.wait();
            
            alert(`成功燃烧 ${amount} AI币！获得分红权重`);
            await this.refreshData();

        } catch (error) {
            console.error('燃烧失败:', error);
            alert('燃烧失败: ' + (error.data?.message || error.message));
        } finally {
            const burnBtn = document.getElementById('burnButton');
            if (burnBtn) {
                burnBtn.textContent = '确认燃烧';
                burnBtn.disabled = false;
            }
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

            const claimBtn = document.getElementById('claimButton');
            if (claimBtn) {
                claimBtn.textContent = '领取中...';
                claimBtn.disabled = true;
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

    // 开奖
    drawRound: async function(roundId) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const roundInfo = await AppState.contracts.lottery.getCurrentRoundInfo();
            
            if (roundInfo._roundId.toNumber() !== roundId) {
                alert('轮次ID不匹配');
                return;
            }

            if (roundInfo.drawn) {
                alert('本期已经开奖过了');
                return;
            }

            if (roundInfo.totalTickets.eq(0)) {
                alert('本期没有购票记录，无法开奖');
                return;
            }

            const drawBtn = document.getElementById('drawBtn');
            if (drawBtn) {
                drawBtn.textContent = '开奖中...';
                drawBtn.disabled = true;
            }

            const tx = await AppState.contracts.lottery.drawRound(roundId);
            await tx.wait();
            
            alert(`🎉 第 ${roundId} 期开奖成功！`);
            await this.refreshData();

        } catch (error) {
            console.error('开奖失败:', error);
            let msg = error.message;
            if (error.data?.message) msg = error.data.message;
            if (msg.includes('Round not ended')) msg = '本期尚未结束';
            if (msg.includes('Already drawn')) msg = '已经开奖过了';
            alert('开奖失败: ' + msg);
        }
    },

    // 领取奖金
    claimPrize: async function(roundId) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }

        try {
            const hasClaimed = await AppState.contracts.lottery.hasClaimed(AppState.userAddress, roundId);
            if (hasClaimed) {
                alert('该轮次奖金已领取');
                return;
            }

            const round = await AppState.contracts.lottery.rounds(roundId);
            if (!round.drawn) {
                alert('该轮次尚未开奖');
                return;
            }

            const [winners, shares] = await AppState.contracts.lottery.getRoundWinners(roundId);
            const myIndex = winners.findIndex(w => w.toLowerCase() === AppState.userAddress.toLowerCase());
            
            if (myIndex === -1) {
                alert('您没有中奖');
                return;
            }

            const prizeAmount = ethers.utils.formatUnits(shares[myIndex], 18);
            const confirmClaim = confirm(`您中了第 ${roundId} 期奖项，奖金 ${prizeAmount} AI币，是否领取？`);
            if (!confirmClaim) return;

            const tx = await AppState.contracts.lottery.claimPrize(roundId);
            await tx.wait();
            
            alert(`🎉 成功领取 ${prizeAmount} AI币 奖金！`);
            await this.refreshData();

        } catch (error) {
            console.error('领奖失败:', error);
            alert('领奖失败: ' + (error.data?.message || error.message));
        }
    },

    // 批量领奖
    claimAllPrizes: async function() {
        if (!AppState.isConnected) return;
        
        try {
            const currentRound = AppState.currentRound.roundId;
            const checkRounds = 10;
            const startRound = Math.max(1, currentRound - checkRounds);
            
            let claimedCount = 0;
            let totalClaimed = ethers.BigNumber.from(0);

            for (let i = startRound; i < currentRound; i++) {
                try {
                    const hasClaimed = await AppState.contracts.lottery.hasClaimed(AppState.userAddress, i);
                    if (hasClaimed) continue;

                    const round = await AppState.contracts.lottery.rounds(i);
                    if (!round.drawn) continue;

                    const [winners, shares] = await AppState.contracts.lottery.getRoundWinners(i);
                    const myIndex = winners.findIndex(w => w.toLowerCase() === AppState.userAddress.toLowerCase());
                    
                    if (myIndex !== -1) {
                        const tx = await AppState.contracts.lottery.claimPrize(i);
                        await tx.wait();
                        claimedCount++;
                        totalClaimed = totalClaimed.add(shares[myIndex]);
                    }
                } catch (e) {
                    console.log(`领取第 ${i} 期失败`, e);
                }
            }

            if (claimedCount > 0) {
                const total = ethers.utils.formatUnits(totalClaimed, 18);
                alert(`成功领取 ${claimedCount} 期奖金，共 ${total} AI币！`);
                await this.refreshData();
            } else {
                alert('没有可领取的奖金');
            }

        } catch (error) {
            console.error('批量领奖失败:', error);
            alert('批量领奖失败: ' + error.message);
        }
    },

    // 加载历史记录
    loadRoundHistory: async function() {
        if (!AppState.isConnected) return;
        
        try {
            const currentRoundId = AppState.currentRound.roundId;
            const history = [];
            
            for (let i = Math.max(1, currentRoundId - 10); i < currentRoundId; i++) {
                try {
                    const round = await AppState.contracts.lottery.rounds(i);
                    if (!round.drawn) continue;
                    
                    const [winners, shares] = await AppState.contracts.lottery.getRoundWinners(i);
                    
                    history.push({
                        roundId: i,
                        prizePool: parseFloat(ethers.utils.formatUnits(round.prizePool, 18)),
                        totalTickets: parseFloat(ethers.utils.formatUnits(round.totalTickets, 18)),
                        drawn: round.drawn,
                        winners: winners,
                        shares: shares.map(s => parseFloat(ethers.utils.formatUnits(s, 18)))
                    });
                } catch (e) {
                    console.log(`加载第 ${i} 期失败`, e);
                }
            }
            
            AppState.historyRounds = history.reverse();
            this.renderHistoryList();
            
        } catch (error) {
            console.error('加载历史记录失败:', error);
        }
    },

    // 渲染历史记录
    renderHistoryList: function() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (AppState.historyRounds.length === 0) {
            container.innerHTML = '<div class="empty-history">暂无历史记录</div>';
            return;
        }

        container.innerHTML = AppState.historyRounds.map(round => {
            const isWinner = round.winners.some(w => 
                w.toLowerCase() === AppState.userAddress.toLowerCase()
            );
            
            return `
                <div class="history-item ${isWinner ? 'won' : ''}">
                    <div class="round-info">
                        <div class="round-id">第 ${round.roundId} 期 ${isWinner ? '<span class="winner-badge">🎉 中奖</span>' : ''}</div>
                        <div class="round-pool">奖池: ${round.prizePool.toFixed(2)} AI币</div>
                    </div>
                    <div class="round-detail">
                        <div>${Math.floor(round.totalTickets)} 张票</div>
                        <div>${round.winners.length} 位中奖</div>
                    </div>
                    ${isWinner ? `
                        <button onclick="ContractAPI.claimPrize(${round.roundId})" class="claim-btn-small can-claim">
                            领取
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        // 显示一键领取按钮
        const hasUnclaimed = AppState.historyRounds.some(round => 
            round.winners.some(w => w.toLowerCase() === AppState.userAddress.toLowerCase())
        );
        
        const claimAllBtn = document.getElementById('claimAllBtn');
        if (claimAllBtn) {
            claimAllBtn.style.display = hasUnclaimed ? 'flex' : 'none';
        }
    },

    // 更新钱包UI
    updateWalletUI: function() {
        const statusDiv = document.getElementById('walletStatus');
        if (!statusDiv) return;
        
        const shortAddr = AppState.userAddress.slice(0, 6) + '...' + AppState.userAddress.slice(-4);
        statusDiv.innerHTML = `
            <span class="address-tag">${shortAddr}</span>
            <button class="refresh-btn" onclick="ContractAPI.refreshData()">🔄</button>
            <button class="disconnect-btn" onclick="location.reload()">✕</button>
        `;
        
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.style.display = 'inline-block';
    },

    // 更新按钮状态
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
                claimBtn.textContent = hasDividend ? 
                    `领取 ${AppState.userData.pendingDividend.toFixed(4)} AI币` : 
                    '无可领取分红';
            }
        }
    },

    // 更新中奖概率
    updateWinChance: function() {
        const ticketInput = document.getElementById('ticketAmount');
        const winChanceEl = document.getElementById('winChance');
        if (!ticketInput || !winChanceEl) return;
        
        const ticketCount = parseInt(ticketInput.value) || 0;
        const myTokens = ticketCount * CONFIG.TICKET_PRICE;
        const totalTokens = AppState.currentRound.totalTickets;
        
        if (totalTokens > 0 || myTokens > 0) {
            const probability = (myTokens / (totalTokens + myTokens) * 100).toFixed(2);
            winChanceEl.textContent = probability + '%';
        } else {
            winChanceEl.textContent = '0%';
        }
    },

    // 更新预计每日分红
    updateDailyDividend: function(burnAmount) {
        const totalWeight = AppState.userData.burnWeight + parseFloat(burnAmount || 0);
        const pendingTax = parseFloat(document.getElementById('dividendPool')?.textContent || 0);
        
        const dailyDividendEl = document.getElementById('dailyDividend');
        if (!dailyDividendEl) return;
        
        if (totalWeight > 0 && pendingTax > 0) {
            const dailyRelease = pendingTax * 0.1;
            const myShare = (parseFloat(burnAmount || 0) / totalWeight) * dailyRelease;
            dailyDividendEl.textContent = myShare.toFixed(4);
        } else {
            dailyDividendEl.textContent = '0';
        }
    },

    // 设置事件监听
    setupEventListeners: function() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                location.reload();
            } else {
                AppState.userAddress = accounts[0];
                this.updateWalletUI();
                this.refreshData();
            }
        });

        window.ethereum.on('chainChanged', () => location.reload());
    },

    // 启动自动刷新
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
                        if (remaining === 0) this.refreshRoundInfo();
                    }
                }
            }
        }, 1000);
        
        setInterval(() => this.refreshData(), 30000);
    }
};

// 导出
window.ContractAPI = ContractAPI;
window.CONFIG = CONFIG;
