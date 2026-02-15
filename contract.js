// contract.js - AI彩票合约接口
const CONFIG = {
    // BSC主网配置（如需测试网请改为97）
    RPC_URL: 'https://bsc-dataseed.binance.org/',
    CHAIN_ID: 56,
    
    // !!! 请替换为你的真实合约地址 !!!
    CONTRACTS: {
        AI_TOKEN: '0x...',      // AI币合约地址
        LOTTERY: '0x...',       // 彩票合约地址
        DIVIDEND: '0x...',      // 分红合约地址
        WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2C08d85d9182b33c'
    },
    
    // ABI（请替换为真实编译后的ABI）
    ABI: {
        TOKEN: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address,uint256) returns (bool)",
            "function allowance(address,address) view returns (uint256)",
            "function transfer(address,uint256) returns (bool)",
            "function transferFrom(address,address,uint256) returns (bool)"
        ],
        LOTTERY: [
            "function buyTickets(uint256 amount) external",
            "function burnTokens(uint256 amount) external",
            "function getJackpot() view returns (uint256)",
            "function getRoundInfo() view returns (uint256 round, uint256 pool, uint256 endTime)",
            "function getMyTickets(address user) view returns (uint256[])",
            "function getTotalTickets() view returns (uint256)"
        ],
        DIVIDEND: [
            "function claimDividend() external",
            "function getClaimable(address user) view returns (uint256)",
            "function getBurnWeight(address user) view returns (uint256)",
            "function getTotalBurned() view returns (uint256)",
            "function dividendPool() view returns (uint256)"
        ]
    }
};

const AppState = {
    provider: null,
    signer: null,
    userAddress: null,
    contracts: {},
    isConnected: false,
    userData: {
        balance: 0,
        burnWeight: 0,
        tickets: [],
        claimable: 0
    }
};

const ContractAPI = {
    connectWallet: async function() {
        try {
            if (!window.ethereum) {
                alert('请安装MetaMask钱包');
                return false;
            }
            
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            AppState.provider = new ethers.providers.Web3Provider(window.ethereum);
            AppState.signer = AppState.provider.getSigner();
            AppState.userAddress = await AppState.signer.getAddress();
            AppState.isConnected = true;
            
            await initContracts();
            updateWalletUI();
            await this.refreshData();
            
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    AppState.userAddress = accounts[0];
                    updateWalletUI();
                    this.refreshData();
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            
            return true;
        } catch (error) {
            console.error('连接失败:', error);
            alert('连接钱包失败: ' + error.message);
            return false;
        }
    },
    
    refreshData: async function() {
        if (!AppState.isConnected) return;
        
        try {
            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            AppState.userData.balance = ethers.utils.formatUnits(balance, 18);
            
            const jackpot = await AppState.contracts.lottery.getJackpot();
            document.getElementById('jackpotAmount').textContent = 
                parseFloat(ethers.utils.formatUnits(jackpot, 18)).toFixed(2);
            
            const roundInfo = await AppState.contracts.lottery.getRoundInfo();
            document.getElementById('roundPool').textContent = 
                parseFloat(ethers.utils.formatUnits(roundInfo.pool, 18)).toFixed(2);
            
            const myTickets = await AppState.contracts.lottery.getMyTickets(AppState.userAddress);
            AppState.userData.tickets = myTickets;
            updateTicketsUI(myTickets);
            
            const weight = await AppState.contracts.dividend.getBurnWeight(AppState.userAddress);
            AppState.userData.burnWeight = ethers.utils.formatUnits(weight, 18);
            document.getElementById('burnPoints').textContent = 
                parseFloat(AppState.userData.burnWeight).toFixed(2);
            
            const claimable = await AppState.contracts.dividend.getClaimable(AppState.userAddress);
            AppState.userData.claimable = ethers.utils.formatUnits(claimable, 18);
            document.getElementById('claimableAmount').textContent = 
                parseFloat(AppState.userData.claimable).toFixed(4);
            
            const divPool = await AppState.contracts.dividend.dividendPool();
            document.getElementById('dividendPool').textContent = 
                parseFloat(ethers.utils.formatUnits(divPool, 18)).toFixed(2);
            
            document.getElementById('userBalance').textContent = 
                parseFloat(AppState.userData.balance).toFixed(2);
            
            updateButtonStates();
            showToast('数据已刷新');
        } catch (error) {
            console.error('刷新数据失败:', error);
            showToast('刷新失败，请重试');
        }
    },
    
    buyTickets: async function(amount) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }
        
        try {
            const cost = ethers.utils.parseUnits((amount * 100).toString(), 18);
            
            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(cost)) {
                alert('AI币余额不足');
                return;
            }
            
            const allowance = await AppState.contracts.token.allowance(
                AppState.userAddress, 
                CONFIG.CONTRACTS.LOTTERY
            );
            
            if (allowance.lt(cost)) {
                showToast('正在授权...');
                const approveTx = await AppState.contracts.token.approve(
                    CONFIG.CONTRACTS.LOTTERY, 
                    ethers.constants.MaxUint256
                );
                await approveTx.wait();
            }
            
            showToast('正在购买...');
            const tx = await AppState.contracts.lottery.buyTickets(amount);
            await tx.wait();
            
            showToast('购买成功！');
            await this.refreshData();
        } catch (error) {
            console.error('购买失败:', error);
            alert('购买失败: ' + (error.data?.message || error.message));
        }
    },
    
    burnTokens: async function(amount) {
        if (!AppState.isConnected) {
            alert('请先连接钱包');
            return;
        }
        
        try {
            const burnAmount = ethers.utils.parseUnits(amount.toString(), 18);
            
            const balance = await AppState.contracts.token.balanceOf(AppState.userAddress);
            if (balance.lt(burnAmount)) {
                alert('AI币余额不足');
                return;
            }
            
            showToast('正在燃烧...');
            const tx = await AppState.contracts.lottery.burnTokens(burnAmount);
            await tx.wait();
            
            showToast('燃烧成功！获得分红权重');
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
            const claimable = await AppState.contracts.dividend.getClaimable(AppState.userAddress);
            if (claimable.eq(0)) {
                alert('没有可领取的分红');
                return;
            }
            
            showToast('正在领取...');
            const tx = await AppState.contracts.dividend.claimDividend();
            await tx.wait();
            
            showToast('领取成功！');
            await this.refreshData();
        } catch (error) {
            console.error('领取失败:', error);
            alert('领取失败: ' + (error.data?.message || error.message));
        }
    },
    
    getRankList: async function() {
        return [
            { address: '0x377e...7777', count: 500 },
            { address: '0x8a3c...f7777', count: 320 },
            { address: '0x9a88...7777', count: 280 },
            { address: '0x1234...5678', count: 150 },
            { address: '0xabcd...efgh', count: 100 }
        ];
    }
};

async function initContracts() {
    AppState.contracts.token = new ethers.Contract(
        CONFIG.CONTRACTS.AI_TOKEN,
        CONFIG.ABI.TOKEN,
        AppState.signer
    );
    
    AppState.contracts.lottery = new ethers.Contract(
        CONFIG.CONTRACTS.LOTTERY,
        CONFIG.ABI.LOTTERY,
        AppState.signer
    );
    
    AppState.contracts.dividend = new ethers.Contract(
        CONFIG.CONTRACTS.DIVIDEND,
        CONFIG.ABI.DIVIDEND,
        AppState.signer
    );
}

function updateWalletUI() {
    const statusDiv = document.getElementById('walletStatus');
    if (AppState.isConnected && AppState.userAddress) {
        const shortAddr = AppState.userAddress.slice(0, 6) + '...' + AppState.userAddress.slice(-4);
        statusDiv.innerHTML = `
            <span class="address-tag">${shortAddr}</span>
            <button class="refresh-btn" onclick="ContractAPI.refreshData()">🔄 刷新</button>
        `;
    }
}

function updateTicketsUI(tickets) {
    const count = tickets.length;
    document.getElementById('myTicketCount').textContent = count;
    
    const container = document.getElementById('myTicketsList');
    if (count === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">暂无彩票，请购买后查看</div>';
    } else {
        container.innerHTML = tickets.map((id, index) => `
            <div class="ticket-item">
                <div class="ticket-id">#${id.toString().slice(-6)}</div>
                <div style="font-size: 10px; opacity: 0.9;">彩票${index + 1}</div>
            </div>
        `).join('');
    }
}

function updateButtonStates() {
    const buyBtn = document.getElementById('buyBtn');
    const burnBtn = document.getElementById('burnButton');
    const claimBtn = document.getElementById('claimButton');
    
    if (AppState.isConnected) {
        buyBtn.disabled = false;
        buyBtn.textContent = '确认购买';
        burnBtn.disabled = false;
        burnBtn.textContent = '确认燃烧';
        claimBtn.disabled = parseFloat(AppState.userData.claimable) <= 0;
        claimBtn.textContent = claimBtn.disabled ? '无可领取分红' : '立即领取';
    }
}

function disconnect() {
    AppState.isConnected = false;
    AppState.userAddress = null;
    AppState.provider = null;
    AppState.signer = null;
    document.getElementById('walletStatus').innerHTML = 
        '<button class="connect-btn" onclick="ContractAPI.connectWallet()">连接钱包</button>';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 2000);
    }
}

async function connectWallet() {
    await ContractAPI.connectWallet();
}
