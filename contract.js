// contract.js
// AI彩票项目 - 双合约接口配置 (ethers.js v5)

// ==================== 配置 ====================
const CONFIG = {
    // 销毁分红合约地址（接收3%税收、处理燃烧、分红、彩票逻辑）
    burnPoolAddress: '0x07bA400b488fa4F3dBeDA52d5f1842a8EB67cA25',
    
    // 代币合约地址（AI币）
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
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

// ---------- 2. 代币合约 ABI (Token Contract) ----------
const TOKEN_ABI = [
   [{"输入":[{"组件":[{"内部类型":"地址","名称":"PCS_V2_FACTORY","类型":"地址"},{"内部类型":"bytes32","名称":"PCS_V2_CODE_HASH","类型":"bytes32"},{"内部类型":"地址","名称":"PCS_V2_ROUTER","类型":"地址"},{"内部类型":"地址","名称":"PCS_SMART_ROUTER","t类型":"地址"},{"内部类型":"地址","名称":"WETH","类型":"地址"},{"内部类型":"地址","名称":"PCS_V3_FACTORY","类型":"地址"},{"内部类型":"bytes32","名称":"PCS_V3_CODE_HASH","类型":"bytes32"},{"内部类型":"地址","名称":"UNI_V2_FACTORY","类型":"地址"},{"内部类型":"内部类型":"地址"} {"internalType":"bytes32","name":"UNI_V2_CODE_HASH","type":"bytes32"},{"internalType":"address","name":"UNI_V3_FACTORY","type":"address"},{"internalType":"bytes32","name":"UNI_V3_CODE_HASH","type":"bytes32"},{"internalType":"address","name":"PCS_V4_VAULT","type":"address"},{"internalType":"ad"连衣裙","名称":"UNI_V4_POOL","类型":"地址"},{"内部类型":"uint256","名称":"MIN_LIQ_THRESHOLD","类型":"uint256"},{"内部类型":"uint256","名称":"START_LIQ_THRESHOLD","类型":"uint256"},{"内部类型":"uint256","名称":"ANTI_FARMER_DURATION","类型":"uint256"}],"内部类型":"结构体FlapTaxToken.ConstructorParams","name":"params","type":"tuple"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[],"name":"EIP712DomainChanged", type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"quoteToken","type":"address"},{"indexed":false,"internalType":"uint256","name":"taxAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"outputAmount","type":"uint256"}],"name":"FlapTaxLiquidationSuccess","type":"event"},{"anonymous":false,"inputs":[{"ind exed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"intern alType":"uint8","name":"fromState","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"toState","type":"uint8"}],"name":"PoolStateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"reason","type":"bytes"}],"name":"TaxLiquidationError","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"fr om","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"TransferFlapToken","type":"event"},{"inputs":[],"name":"ANTI_FARMER_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view ","type":"function"},{"inputs":[],"name":"MIN_LIQ_THRESHOLD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"QUOTE_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"START_LIQ_THRESHOLD","outputs":[{"internalType": "uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TAX_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","out puts":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"antiFarmerExpirationTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs" :[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inpu ts":[],"name":"eip712Domain","outputs":[{"internalType":"bytes1","name":"fields","type":"bytes1"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"version","type":"string"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"address","name":"verifyingContract","type":"address"},{"internalType":"bytes32","name":"sa lt","type":"bytes32"},{"internalType":"uint256[]","name":"extensions","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"finalizeMigration","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance",outputs":[{"internalType":"bool",name":"",type":"bool"}],"stateMutability":"nonpayable",type":"function"},{"inputs":[{"components":[{"internalType":"string",name":"name",type":"string"},{"internalType":"string",name":"symbol",type":"string"},{"internalType":"string",name":"meta",type":"string"},{"internalT类型":"uint16","名称":"税","类型":"uint16"},{"内部类型":"地址","名称":"税分割器","类型":"地址"},{"内部类型":"地址","名称":"报价令牌","类型":"地址"},{"内部类型":"uint256","名称":"liq预期输出金额","类型":"uint256"},{"内部类型":"uint256","名称":"税时长","类型":"uint256"}],"内部类型":"结构体{{"IFlapTaxToken.InitParams", name":"params", type":"tuple"}]", name":"initialize", outputs":[]", stateMutability":"nonpayable", type":"function"},{"inputs":[]", name":"liqExpectedOutputAmount", outputs":[{"internalType":"uint256", name":""", type":"uint256"}]", stateMutability":"view", type":"function"},{"inputs":[]", name":"liquidationThreshold", outputs":[{"internalType":"uint256", name":""", type":"uint256"}]", stateMutability":"view", type":"function"} e":"function"},{"inputs":[],"name":"mainPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"metaURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name": "owner",outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline"," type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"pools","outputs":[{"i nternalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startMigration","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"state","outputs":[{"internalType":"enum FlapTaxToken.PoolState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxExpirationTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxRate","outputs":[{"internalType":"uint16","name":"" ,"type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxSplitter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{ "internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"addr ess"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxExpirationTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxRate","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"fu nction"},{"inputs":[],"name":"taxSplitter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to" ,"type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalTy pe":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxExpirationTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxRate","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"fu nction"},{"inputs":[],"name":"taxSplitter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to" ,"type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalTy pe":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxRate","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxSplitter","outputs":[{"internalType":"address","name":"","type":"a ddress"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type ":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","ty pe":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxRate","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taxSplitter","outputs":[{"internalType":"address","name":"","type":"a ddress"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type ":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","ty pe":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}][{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"fu nction"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}][{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"fu nction"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]

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
    const formatted = ethers.utils.formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(fixed).replace(/\.?0+$/, '');
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

/**
 * 初始化 Provider（只读模式）
 */
async function initProvider() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
        provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
        showToast('未检测到钱包，使用只读模式', 4000);
    }
    return provider;
}

/**
 * 初始化所有合约（只读模式）
 */
async function initContracts() {
    if (!provider) await initProvider();
    
    // 初始化销毁分红合约
    burnPoolContract = new ethers.Contract(CONFIG.burnPoolAddress, BURN_POOL_ABI, provider);
    
    // 初始化代币合约
    tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);
    
    // 获取代币基本信息
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

/**
 * 使用 Signer 重新连接合约（可写模式）
 */
async function connectContractsWithSigner() {
    if (!signer) throw new Error('No signer available');
    
    burnPoolContract = burnPoolContract.connect(signer);
    tokenContract = tokenContract.connect(signer);
    
    return { burnPoolContract, tokenContract };
}

// ==================== 钱包连接 ====================

/**
 * 连接钱包
 */
async function connectWallet() {
    if (!window.ethereum) {
        showToast('请安装MetaMask');
        return;
    }
    
    try {
        // 请求账户授权
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // 重新初始化 provider 和 signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        currentAccount = await signer.getAddress();
        isConnected = true;

        // 更新UI
        updateWalletUI();
        
        // 使用 signer 重新连接合约
        await connectContractsWithSigner();

        // 检查网络
        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.chainId) {
            showToast(`请切换到链ID ${CONFIG.chainId}`, 5000);
        }

        // 刷新数据
        await refreshAllData();

        // 监听账户变化
        setupEventListeners();

    } catch (e) {
        console.error('连接钱包失败:', e);
        showToast('连接钱包失败: ' + e.message);
    }
}

/**
 * 断开钱包连接
 */
function disconnectWallet() {
    isConnected = false;
    currentAccount = null;
    signer = null;
    
    // 重置为只读模式
    if (provider) {
        burnPoolContract = new ethers.Contract(CONFIG.burnPoolAddress, BURN_POOL_ABI, provider);
        tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);
    }
    
    updateWalletUI();
    refreshAllData();
}

/**
 * 更新钱包相关UI
 */
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

/**
 * 设置事件监听
 */
function setupEventListeners() {
    if (!window.ethereum) return;
    
    // 账户变化
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            currentAccount = accounts[0];
            updateWalletUI();
            refreshAllData();
        }
    });
    
    // 链变化
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// ==================== 数据刷新 ====================

/**
 * 刷新所有数据
 */
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

/**
 * 刷新用户相关数据
 */
async function refreshUserData() {
    if (!burnPoolContract || !tokenContract) await initContracts();
    
    if (!currentAccount) {
        // 未连接时清空用户数据
        clearUserUI();
        return;
    }

    try {
        // 并行获取用户数据
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

        // 更新UI
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

/**
 * 刷新奖池数据
 */
async function refreshPoolData() {
    if (!burnPoolContract) await initContracts();
    
    try {
        const wbnbBalance = await burnPoolContract.getWBNBBalance();
        
        // 更新分红池显示
        const dividendPoolEl = document.getElementById('dividendPool');
        if (dividendPoolEl) {
            dividendPoolEl.innerText = formatAmount(wbnbBalance, 18, 4) + ' WBNB';
        }
    } catch (e) {
        console.error('刷新奖池数据失败:', e);
    }
}

/**
 * 刷新轮次数据
 */
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
        
        // 更新按钮状态
        updateActionButtons();
        
    } catch (e) {
        console.error('刷新轮次数据失败:', e);
    }
}

// ==================== UI 更新函数 ====================

function updateUserUI(data) {
    const { userBalance, burnWeight, tickets, pendingDiv, totalClaimed } = data;
    
    // 代币余额
    const userBalanceEl = document.getElementById('userBalance');
    if (userBalanceEl) userBalanceEl.innerText = formatAmount(userBalance, tokenDecimals);
    
    // 燃烧积分/权重
    const burnPointsEl = document.getElementById('burnPoints');
    if (burnPointsEl) burnPointsEl.innerText = formatAmount(burnWeight, tokenDecimals);
    
    const burnWeightEl = document.getElementById('burnWeight');
    if (burnWeightEl) burnWeightEl.innerText = formatAmount(burnWeight, tokenDecimals);
    
    const totalBurnedEl = document.getElementById('totalBurned');
    if (totalBurnedEl) totalBurnedEl.innerText = formatAmount(burnWeight, tokenDecimals) + ' AI币';
    
    // 彩票数量
    const myTicketCountEl = document.getElementById('myTicketCount');
    if (myTicketCountEl) myTicketCountEl.innerText = tickets.toString();
    
    // 分红相关 - 全部显示为 WBNB
    const claimableAmountEl = document.getElementById('claimableAmount');
    if (claimableAmountEl) claimableAmountEl.innerText = formatAmount(pendingDiv, 18, 6) + ' WBNB';
    
    const totalDividendEl = document.getElementById('totalDividend');
    if (totalDividendEl) totalDividendEl.innerText = formatAmount(totalClaimed, 18, 6) + ' WBNB';
    
    // 每日分红估算
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
    // 当前轮次
    const currentRoundEl = document.getElementById('currentRound');
    if (currentRoundEl) currentRoundEl.innerText = roundInfo.roundId;
    
    // 奖池金额（AI币）
    const jackpotAmountEl = document.getElementById('jackpotAmount');
    if (jackpotAmountEl) jackpotAmountEl.innerText = formatAmount(roundInfo.prizePool, tokenDecimals) + ' AI币';
    
    const roundPoolDisplayEl = document.getElementById('roundPoolDisplay');
    if (roundPoolDisplayEl) roundPoolDisplayEl.innerText = formatAmount(roundInfo.prizePool, tokenDecimals) + ' AI币';
    
    // 总票数/参与人数
    const totalTicketsDisplayEl = document.getElementById('totalTicketsDisplay');
    if (totalTicketsDisplayEl) totalTicketsDisplayEl.innerText = roundInfo.totalTickets.toString();
    
    const participantCountEl = document.getElementById('participantCount');
    if (participantCountEl) participantCountEl.innerText = roundInfo.totalTickets.toString();
    
    // 状态显示
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
    
    // 倒计时
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
    
    // 燃烧按钮
    const burnButton = document.getElementById('burnButton');
    if (burnButton) burnButton.disabled = !isConnected;
    
    // 领取按钮
    const claimButton = document.getElementById('claimButton');
    if (claimButton) claimButton.disabled = !isConnected;
}

// ==================== 业务逻辑函数 ====================

/**
 * 获取累计分红（通过查询事件）
 */
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

/**
 * 估算每日分红
 */
async function estimateDailyDividend(userBurnWeight) {
    if (!burnPoolContract || !userBurnWeight || userBurnWeight.eq(0)) return '0';
    
    try {
        const [totalWeight, pendingTax] = await Promise.all([
            burnPoolContract.totalBurnWeight(),
            burnPoolContract.pendingTax()
        ]);
        
        if (totalWeight.eq(0)) return '0';
        
        // 简化估算：假设每天产生类似的税收
        const dailyTax = pendingTax.mul(2);
        const userShare = dailyTax.mul(userBurnWeight).div(totalWeight);
        
        return formatAmount(userShare, 18, 6);
    } catch (e) {
        return '0';
    }
}

/**
 * 更新每日分红估算显示
 */
async function updateDailyDividendEstimate(burnWeight) {
    const dailyDividendEl = document.getElementById('dailyDividend');
    if (!dailyDividendEl) return;
    
    const estimate = await estimateDailyDividend(burnWeight);
    dailyDividendEl.innerText = estimate + ' WBNB';
}

/**
 * 更新倒计时
 */
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

/**
 * 购买彩票
 */
async function buyTickets(ticketCount) {
    if (!isConnected) {
        showToast('请先连接钱包');
        return;
    }
    
    const amount = ticketCount * 100; // 100代币/张
    const amountWei = parseAmount(amount.toString(), tokenDecimals);

    try {
        // 检查授权
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.burnPoolAddress);
        
        if (allowance.lt(amountWei)) {
            showToast('正在授权代币...', 2000);
            const txApprove = await tokenContract.approve(CONFIG.burnPoolAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
            showToast('授权成功', 2000);
        }

        // 购买彩票
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

/**
 * 燃烧代币
 */
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
        // 检查授权
        const allowance = await tokenContract.allowance(currentAccount, CONFIG.burnPoolAddress);
        
        if (allowance.lt(amountWei)) {
            showToast('正在授权代币...', 2000);
            const txApprove = await tokenContract.approve(CONFIG.burnPoolAddress, ethers.constants.MaxUint256);
            await txApprove.wait();
            showToast('授权成功', 2000);
        }

        // 执行燃烧
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

/**
 * 领取分红
 */
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

/**
 * 开奖
 */
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

/**
 * 领取单个轮次奖金
 */
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

/**
 * 一键领取所有奖金
 */
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

/**
 * 加载历史开奖记录
 */
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

        // 从最新轮次往前遍历（最多10轮）
        const start = roundId > 10 ? roundId - 9 : 1;
        
        for (let i = roundId; i >= start; i--) {
            try {
                const info = await burnPoolContract.getRoundInfo(i);
                
                if (!info.drawn) continue; // 只显示已开奖的轮次
                
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

/**
 * 加载燃烧排行（替代彩票排行）
 */
async function loadBurnRank() {
    if (!burnPoolContract) await initContracts();
    
    const rankList = document.getElementById('rankList');
    if (!rankList) return;

    try {
        // 通过Burn事件获取燃烧数据
        const filter = burnPoolContract.filters.Burn();
        const events = await burnPoolContract.queryFilter(filter, 0, 'latest');
        
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

/**
 * 更新中奖概率
 */
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

/**
 * 更新每日分红估算（输入变化时）
 */
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
    // 钱包
    connectWallet,
    disconnectWallet,
    
    // 数据刷新
    refreshData: refreshAllData,
    
    // 合约交互
    buyTickets,
    burnTokens,
    claimDividend,
    drawRound,
    claimPrize,
    claimAllPrizes,
    
    // 数据加载
    loadRoundHistory,
    loadBurnRank,
    
    // 工具
    updateWinChance,
    updateDailyDividend,
    
    // 获取合约实例（供外部使用）
    getBurnPoolContract: () => burnPoolContract,
    getTokenContract: () => tokenContract,
    getProvider: () => provider,
    getSigner: () => signer,
    getCurrentAccount: () => currentAccount,
    isWalletConnected: () => isConnected
};

// ==================== 初始化 ====================

// 页面加载时自动初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initContracts();
        await refreshAllData();
        await loadRoundHistory();
        
        // 启动定时刷新（30秒）
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
