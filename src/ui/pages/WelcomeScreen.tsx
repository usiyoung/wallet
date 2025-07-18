import { useState } from "react";
import { useDispatch } from "react-redux";
import { setSettingUp } from "../store/slices/walletSlice";
import { bridge } from "../store/middleware/background-bridge";

function WelcomeScreen() {
  const dispatch = useDispatch();
  const [mnemonic, setMnemonic] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState("");

  const handleCreateWallet = () => {
    dispatch(setSettingUp(true));
  };

  const handleRestoreWallet = () => {
    setIsRestoring(true);
  };

  const handleMnemonicSubmit = async () => {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      setError("복구문은 정확히 12개의 단어여야 합니다.");
      return;
    }

    await bridge.call("KeyringController:setTempMnemonic", mnemonic.trim());

    dispatch(setSettingUp(true));
  };

  const handleBack = () => {
    setIsRestoring(false);
    setMnemonic("");
    setError("");
  };

  if (isRestoring) {
    return (
      <div className="w-[375px] h-[600px] bg-gradient-to-br from-gray-50 to-white flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 px-4 py-3 border-b backdrop-blur-lg bg-white/80 border-gray-100/50">
          <div className="flex gap-4 items-center">
            <button
              onClick={handleBack}
              className="flex justify-center items-center w-10 h-10 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 bg-white/90 hover:bg-white border-gray-100/50 shadow-gray-200/10 hover:shadow-xl hover:shadow-gray-200/20"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="ml-3 text-lg font-bold text-gray-800">지갑 복구</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="overflow-y-auto flex-1">
          <div className="flex flex-col p-6 space-y-4 h-full">
            <div className="flex-1 rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
              <div className="mb-6 text-center">
                <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl"></div>
                <h2 className="mb-2 text-xl font-bold text-gray-800">
                  지갑 복구
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  기존 지갑의 12개 복구 구문을 입력하여 지갑을 복구하세요
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-800">
                    12개 복구 구문
                  </label>
                  <textarea
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="복구 구문 12개 단어를 순서대로 입력하세요 (공백으로 구분)"
                    rows={4}
                    className="px-4 py-4 w-full placeholder-gray-500 text-gray-800 rounded-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 resize-none bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                  {error && (
                    <p className="mt-2 ml-1 text-xs text-red-500">{error}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleMnemonicSubmit}
              disabled={!mnemonic.trim()}
              className="py-4 w-full text-lg font-semibold text-white rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 bg-blue-500/90 hover:bg-blue-600 disabled:bg-gray-300/80 shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 disabled:cursor-not-allowed"
            >
              지갑 복구하기
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-[375px] h-[600px] bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <div className="flex flex-col flex-1 justify-center items-center p-6">
        {/* Logo */}
        <div className="flex justify-center items-center mb-8 w-24 h-24 rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
          <span className="text-4xl">🏦</span>
        </div>

        {/* Welcome Content */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-800">
            SOOHO IO Wallet에
            <br />
            오신 것을 환영합니다
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-gray-600">
            SOOHO IO 블록체인을 위한 안전하고 간편한 암호화폐 지갑입니다
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 w-full">
          <button
            onClick={handleCreateWallet}
            className="flex gap-3 justify-center items-center py-4 w-full text-lg font-semibold text-white rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 bg-blue-500/90 hover:bg-blue-600 shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30"
          >
            <span>새 지갑 생성</span>
          </button>

          <button
            onClick={handleRestoreWallet}
            className="flex gap-3 justify-center items-center py-4 w-full text-lg font-semibold text-gray-800 rounded-2xl border shadow-lg backdrop-blur-lg transition-all duration-300 bg-white/90 hover:bg-white border-gray-100/50 shadow-gray-200/10 hover:shadow-xl hover:shadow-gray-200/20"
          >
            <span>기존 지갑 복구</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">v1.0.0 • SOOHO IO Network</p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
