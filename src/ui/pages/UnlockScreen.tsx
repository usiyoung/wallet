import React, { useState } from "react";
import { bridge } from "../store/middleware/background-bridge";
import { useDispatch } from "react-redux";
import { setUnlocked, setAccounts } from "../store/slices/walletSlice";

function UnlockScreen() {
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await bridge.call("KeyringController:unlock", password);
      const accounts = await bridge.call("KeyringController:getAccounts");

      dispatch(setUnlocked(true));
      dispatch(setAccounts(accounts));
    } catch (error) {
      setError("비밀번호가 올바르지 않습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[375px] h-[600px] bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <div className="flex flex-col flex-1 justify-center items-center p-6">
        {/* Logo/Icon */}
        <div className="flex justify-center items-center mb-8 w-24 h-24 rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
          <span className="text-4xl">🔒</span>
        </div>

        {/* Title and Description */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-800">
            지갑 잠금 해제
          </h1>
          <p className="text-base leading-relaxed text-gray-600">
            계속하려면 비밀번호를 입력하세요
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 w-full rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label className="block mb-3 text-sm font-semibold text-gray-800">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="px-4 py-4 w-full placeholder-gray-500 text-gray-800 rounded-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                autoFocus
              />
              {error && (
                <p className="mt-2 ml-1 text-xs text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="py-4 w-full text-lg font-semibold text-white rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 bg-blue-500/90 hover:bg-blue-600 disabled:bg-gray-300/80 shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex gap-2 justify-center items-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                  <span>잠금 해제 중...</span>
                </div>
              ) : (
                "잠금 해제"
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            SOOHO IO Wallet으로 안전하게 관리하세요
          </p>
        </div>
      </div>
    </div>
  );
}

export default UnlockScreen;
