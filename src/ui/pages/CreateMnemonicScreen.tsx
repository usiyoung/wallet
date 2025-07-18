import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setUnlocked,
  setInitialized,
  setSettingUp,
  setAccounts,
} from "../store/slices/walletSlice";
import { bridge } from "../store/middleware/background-bridge";

function CreateMnemonicScreen() {
  const dispatch = useDispatch();
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoreMode, setIsRestoreMode] = useState(false);

  useEffect(() => {
    const initializeMnemonic = async () => {
      try {
        const tempMnemonic = await bridge.call(
          "KeyringController:getTempMnemonic"
        );
        if (tempMnemonic) {
          setIsRestoreMode(true);
          setMnemonic(tempMnemonic);
          setStep(2);
          await bridge.call("KeyringController:clearTempMnemonic");
        } else {
          generateMnemonic();
        }
      } catch (error) {
        console.error("임시 니모닉 조회 실패:", error);
        generateMnemonic();
      }
    };

    initializeMnemonic();
  }, []);

  const generateMnemonic = async () => {
    try {
      const newMnemonic = await bridge.call(
        "KeyringController:generateMnemonic"
      );
      setMnemonic(newMnemonic);
    } catch (error) {
      console.error("Failed to generate mnemonic:", error);
      setMnemonic("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (password === confirmPassword && password.length >= 8) {
        setIsLoading(true);
        try {
          await bridge.call(
            "KeyringController:createNewVaultAndRestore",
            password,
            mnemonic
          );

          const accounts = await bridge.call("KeyringController:getAccounts");

          dispatch(setInitialized(true));
          dispatch(setUnlocked(true));
          dispatch(setSettingUp(false));
          dispatch(setAccounts(accounts));
        } catch (error) {
          console.error("Failed to create wallet:", error);
          alert("지갑 생성에 실패했습니다. 다시 시도해주세요.");
        } finally {
          setIsLoading(false);
        }
      } else {
        alert("비밀번호가 일치하지 않거나 8자 미만입니다.");
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      dispatch(setSettingUp(false));
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      alert("복구 구문이 클립보드에 복사되었습니다!");
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("복사에 실패했습니다. 수동으로 복사해주세요.");
    }
  };

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
          <h1 className="ml-3 text-lg font-bold text-gray-800">
            {isRestoreMode ? "지갑 복구" : "새 지갑 생성"}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="overflow-y-auto flex-1">
        <div className="p-6 space-y-4 h-full">
          {step === 1 ? (
            <>
              {/* Step 1: Show Mnemonic */}
              <div className="rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-xl font-bold text-gray-800">
                    {isRestoreMode ? "복구 구문 확인" : "복구 구문 저장"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isRestoreMode
                      ? "입력하신 복구 구문을 확인해주세요"
                      : "이 12개 단어를 안전한 곳에 저장하세요"}
                  </p>
                </div>

                <div className="p-4 mb-6 rounded-2xl backdrop-blur-sm bg-gray-50/80">
                  <div className="grid grid-cols-3 gap-3">
                    {mnemonic.split(" ").map((word, index) => (
                      <div
                        key={index}
                        className="p-3 text-center rounded-xl border bg-white/90 border-gray-100/50"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {word}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!isRestoreMode && (
                  <button
                    onClick={copyToClipboard}
                    className="py-3 mb-4 w-full font-medium text-gray-700 rounded-2xl transition-all duration-300 bg-gray-100/80 hover:bg-gray-200/80"
                  >
                    클립보드에 복사
                  </button>
                )}
              </div>

              <button
                onClick={handleNext}
                className="py-4 w-full text-lg font-semibold text-white rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 bg-blue-500/90 hover:bg-blue-600 shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30"
              >
                다음 단계
              </button>
            </>
          ) : (
            <>
              {/* Step 2: Set Password */}
              <div className="rounded-3xl border shadow-xl backdrop-blur-lg bg-white/90 border-gray-100/50 shadow-gray-200/20">
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-xl font-bold text-gray-800">
                    비밀번호 설정
                  </h2>
                  <p className="text-sm text-gray-600">
                    지갑을 보호할 비밀번호를 설정하세요
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-3 text-sm font-semibold text-gray-800">
                      비밀번호 (최소 8자)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      className="px-4 py-4 w-full placeholder-gray-500 text-gray-800 rounded-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-semibold text-gray-800">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      className="px-4 py-4 w-full placeholder-gray-500 text-gray-800 rounded-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  {password &&
                    confirmPassword &&
                    password !== confirmPassword && (
                      <p className="ml-1 text-xs text-red-500">
                        비밀번호가 일치하지 않습니다
                      </p>
                    )}

                  {password && password.length < 8 && (
                    <p className="ml-1 text-xs text-yellow-600">
                      비밀번호는 최소 8자 이상이어야 합니다
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={
                  isLoading ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword ||
                  password.length < 8
                }
                className="py-4 w-full text-lg font-semibold text-white rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 bg-blue-500/90 hover:bg-blue-600 disabled:bg-gray-300/80 shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex gap-2 justify-center items-center">
                    <div className="w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                    <span>지갑 생성 중...</span>
                  </div>
                ) : (
                  "지갑 생성 완료"
                )}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default CreateMnemonicScreen;
