import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setSelectedAccount } from "../store/slices/walletSlice";
import { bridge } from "../store/middleware/background-bridge";

interface Account {
  address: string;
  name: string;
  metadata: any;
}

function AccountSelector() {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(
    (state: RootState) => state.wallet.selectedAccount
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountList, setAccountList] = useState<Account[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accountData = await bridge.call("AccountController:listAccounts");
      setAccountList(accountData);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const handleAccountSelect = async (address: string) => {
    try {
      await bridge.call("AccountController:setSelectedAccount", address);
      dispatch(setSelectedAccount(address));
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to select account:", error);
    }
  };

  const handleAddAccount = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newAccountAddress = await bridge.call(
        "KeyringController:addNewAccount"
      );

      await loadAccounts();
      dispatch(setSelectedAccount(newAccountAddress));
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add new account:", error);
      alert("새 계정 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentAccount = () => {
    return accountList.find((account) => account.address === selectedAccount);
  };

  const currentAccount = getCurrentAccount();

  return (
    <div className="relative">
      <button
        className="flex items-center justify-between bg-white/90 backdrop-blur-lg hover:bg-white border border-gray-100/50 rounded-2xl px-4 py-3 transition-all duration-300 min-w-[220px] shadow-lg shadow-gray-200/10 hover:shadow-xl hover:shadow-gray-200/20 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
          {currentAccount ? (
            <div className="text-sm text-gray-600 font-mono truncate w-full">
              {`${currentAccount.address.slice(
                0,
                8
              )}...${currentAccount.address.slice(-6)}`}
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-700">
              계정을 선택하세요
            </div>
          )}
        </div>
        <span
          className={`text-sm text-gray-500 transition-transform duration-300 ml-2 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 bg-white/95 backdrop-blur-lg border border-gray-100/50 rounded-2xl shadow-2xl shadow-gray-200/30 mt-2 z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {accountList.map((account) => (
              <button
                key={account.address}
                className={`flex items-center justify-between w-full p-4 border-b border-gray-50/50 last:border-b-0 transition-all duration-200 ${
                  account.address === selectedAccount
                    ? "bg-blue-50/70 hover:bg-blue-100/70"
                    : "hover:bg-gray-50/70"
                }`}
                onClick={() => handleAccountSelect(account.address)}
              >
                <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">
                    {account.name}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate w-full">
                    {`${account.address.slice(0, 12)}...${account.address.slice(
                      -8
                    )}`}
                  </div>
                </div>
                {account.address === selectedAccount && (
                  <span className="text-blue-500 text-lg font-bold ml-3 flex-shrink-0">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100/50 p-3">
            <button
              className="flex items-center justify-center gap-2 w-full p-4 bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddAccount}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold">+</span>
                  <span>새 계정 추가</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSelector;
