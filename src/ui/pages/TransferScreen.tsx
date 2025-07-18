import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setCurrentPage } from "../store/slices/walletSlice";
import { bridge } from "../store/middleware/background-bridge";

function TransferScreen() {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(
    (state: RootState) => state.wallet.selectedAccount
  );

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    toAddress?: string;
    amount?: string;
  }>({});

  useEffect(() => {
    if (selectedAccount) {
      loadBalance();
    }
  }, [selectedAccount]);

  const loadBalance = async () => {
    if (!selectedAccount) return;

    const accountBalance = await bridge.call(
      "AccountController:getBalance",
      selectedAccount
    );

    setBalance(accountBalance);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!toAddress.trim()) {
      newErrors.toAddress = "받는 주소를 입력해주세요";
    } else if (toAddress.length < 10) {
      newErrors.toAddress = "올바른 주소를 입력해주세요";
    }

    if (!amount.trim()) {
      newErrors.amount = "금액을 입력해주세요";
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "올바른 금액을 입력해주세요";
    } else if (Number(amount) > Number(balance)) {
      newErrors.amount = "잔액이 부족합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await bridge.call(
        "TransactionController:sendTransaction",
        {
          from: selectedAccount,
          to: toAddress,
          value: amount,
        }
      );
      console.log(result);
      setTimeout(() => {
        alert(`전송 성공!`);
        // Reset form
        setToAddress("");
        setAmount("");
        setErrors({});
        setIsLoading(false);
      }, 8000);
    } catch (error) {
      console.error("전송 실패:", error);
      setIsLoading(false);
      alert("전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleBack = () => {
    dispatch(setCurrentPage("dashboard"));
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 border-b backdrop-blur-lg bg-white/80 border-gray-100/50">
        <div className="flex gap-4 items-center">
          <button
            onClick={handleBack}
            className="flex justify-center items-center w-10 h-10 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 bg-white/90 hover:bg-white border-gray-100/50 shadow-gray-200/10 hover:shadow-xl hover:shadow-gray-200/20"
          >
            <span className="text-lg">←</span>
          </button>
          <h1 className="ml-3 text-lg font-bold text-gray-800">
            BARREL 보내기
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="overflow-y-auto flex-1">
        <div className="p-6 space-y-4">
          {/* Balance Card */}
          <div className="p-2 rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
            <div className="text-center">
              <p className="mb-1 text-sm font-medium text-gray-500">
                사용 가능한 잔액
              </p>
              <h2 className="text-3xl font-bold text-gray-800">
                {balance} <span className="text-xl text-gray-600">BARREL</span>
              </h2>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
            <div className="space-y-6">
              {/* To Address */}
              <div className="mb-2">
                <label className="block mb-3 text-sm font-semibold text-gray-800">
                  받는 주소
                </label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className="px-4 py-4 w-full placeholder-gray-500 text-gray-800 rounded-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                {errors.toAddress && (
                  <p className="mt-2 ml-1 text-xs text-red-500">
                    {errors.toAddress}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-800">
                  보낼 금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="px-4 py-4 pr-20 w-full placeholder-gray-500 text-gray-800 rounded-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                  {/* <span className="absolute right-4 top-1/2 font-medium text-gray-600 transform -translate-y-1/2">
                    BARREL
                  </span> */}
                </div>
                {errors.amount && (
                  <p className="mt-2 ml-1 text-xs text-red-500">
                    {errors.amount}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSend}
              disabled={isLoading || !selectedAccount}
              className="py-4 w-full text-lg font-semibold text-white rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 bg-blue-500/90 hover:bg-blue-600 disabled:bg-gray-300/80 shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex gap-2 justify-center items-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                  <span>전송 중...</span>
                </div>
              ) : (
                "BARREL 보내기"
              )}
            </button>
          </div>

          {/* Transaction Info */}
          <div className="p-4 rounded-2xl border backdrop-blur-sm bg-white/60 border-gray-100/50">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              거래 정보
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>네트워크</span>
                <span className="font-medium">SOOHO IO</span>
              </div>
              <div className="flex justify-between">
                <span>가스비</span>
                <span className="font-medium">0.001 BARREL</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TransferScreen;
