import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setCurrentPage, setBalance } from "../store/slices/walletSlice";
import AccountSelector from "../components/AccountSelector";
import { bridge } from "../store/middleware/background-bridge";
import { useEffect, useState } from "react";

interface Transaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
}

function Dashboard() {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(
    (state: RootState) => state.wallet.selectedAccount
  );
  const balance = useSelector((state: RootState) => state.wallet.balance);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentTransactions();
    if (selectedAccount) {
      loadBalance();
    }
  }, [selectedAccount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedAccount) {
        loadBalance();
      }
      loadRecentTransactions();
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedAccount]);

  const loadBalance = async () => {
    if (!selectedAccount) return;

    try {
      const accountBalance = await bridge.call(
        "AccountController:getBalance",
        selectedAccount
      );

      dispatch(setBalance(accountBalance));
    } catch (error) {
      console.error("잔액 로딩 실패:", error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const transactions = await bridge.call(
        "TransactionController:getRecentTransactions"
      );
      setRecentTransactions(transactions);
    } catch (error) {
      console.error("최근 거래 로딩 실패:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() * 1000000;
    const diffNano = now - timestamp;
    const diffMinutes = Math.floor(diffNano / (1000000 * 1000 * 60));

    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const formatAddress = (address: string) => {
    return `0x${address.slice(0, 8)}...`;
  };

  const formatValue = (hexValue: string) => {
    const decimalValue = parseInt(hexValue, 16);
    return `${decimalValue} Barrel`;
  };

  const handleSendClick = () => {
    dispatch(setCurrentPage("transfer"));
  };

  const handleFaucetClick = async () => {
    if (!selectedAccount) {
      alert("계정을 선택해주세요");
      return;
    }

    try {
      setLoading(true);
      const result = await bridge.call(
        "TransactionController:faucet",
        selectedAccount
      );
      alert(
        `파우셋 성공!\n트랜잭션 해시: ${result.hash}\n받은 금액: ${result.value} BARREL`
      );
      loadRecentTransactions();

      setTimeout(() => {
        setLoading(false);
      }, 4000);
    } catch (error) {
      setLoading(false);
      alert("The account already has sufficient balance of 10 Barrel or more.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="sticky top-0 z-50 px-4 py-3 border-b backdrop-blur-lg bg-white/80 border-gray-100/50">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-800">SOOHO IO Wallet</h1>
          <AccountSelector />
        </div>
      </header>

      <main className="overflow-y-auto flex-1">
        <div className="flex flex-col p-4 space-y-3 min-h-full">
          <div className="pb-0 h-48 rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
            <div className="flex flex-col justify-center h-full text-center">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">
                  총 잔액
                </p>
                <h2 className="text-4xl font-bold text-gray-800">
                  {balance}{" "}
                  <span className="text-2xl text-gray-600">BARREL</span>
                </h2>
              </div>

              <div className="m-0">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  현재 계정
                </p>
                <div className="p-3 rounded-2xl border border-gray-100 backdrop-blur-sm bg-gray-50/80">
                  {selectedAccount ? (
                    <span className="block font-mono text-sm leading-relaxed text-gray-700 break-all">
                      {selectedAccount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      계정을 선택해주세요
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 h-24">
            <button
              onClick={handleSendClick}
              className="flex flex-col gap-3 items-center p-5 rounded-2xl border shadow-lg backdrop-blur-lg transition-all duration-300 cursor-pointer bg-white/90 hover:bg-white border-gray-100/50 shadow-gray-200/10 hover:shadow-xl hover:shadow-gray-200/20"
            >
              <span className="text-3xl">📤</span>
              <span className="text-base font-semibold text-gray-800">
                Send
              </span>
            </button>

            <button
              onClick={handleFaucetClick}
              disabled={loading}
              className="flex relative flex-col gap-3 items-center p-5 rounded-2xl border shadow-lg backdrop-blur-lg transition-all duration-300 cursor-pointer bg-white/90 hover:bg-white border-gray-100/50 shadow-gray-200/10 hover:shadow-xl hover:shadow-gray-200/20"
            >
              <span className="text-3xl">🚰</span>
              <span className="text-base font-semibold text-gray-800">
                {loading ? "loading..." : "Faucet"}
              </span>
            </button>
          </div>

          <div className="flex flex-col p-3 h-96 rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
            <div className="flex flex-shrink-0 justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">최근 거래</h3>
            </div>

            <div className="overflow-y-auto flex-1">
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.slice(0, 8).map((tx) => (
                    <div
                      key={tx.hash}
                      className="flex justify-between items-center px-2 py-3 rounded-xl transition-colors hover:bg-gray-50/50"
                    >
                      <div className="flex flex-1 items-center space-x-3">
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`https://scan.barrelleye.com/transaction/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-teal-600 transition-colors cursor-pointer hover:text-teal-700 hover:underline"
                              title={`전체 해시: ${tx.hash}`}
                            >
                              0x{tx.hash.slice(0, 8)}...
                            </a>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(tx.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 space-x-1">
                            <span className="text-xs text-gray-600">
                              {formatAddress(tx.from)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-xs text-gray-600">
                              {formatAddress(tx.to)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-800">
                          {formatValue(tx.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <div className="flex justify-center items-center mx-auto mb-4 w-20 h-20 rounded-full bg-gray-50/80">
                      <span className="text-3xl text-gray-400">📄</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      거래 내역을 불러올 수 없습니다
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
