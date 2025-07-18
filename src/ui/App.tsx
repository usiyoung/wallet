import { useSelector } from "react-redux";
import { RootState } from "./store";
import WelcomeScreen from "./pages/WelcomeScreen";
import CreateMnemonicScreen from "./pages/CreateMnemonicScreen";
import UnlockScreen from "./pages/UnlockScreen";
import Dashboard from "./pages/Dashboard";
import TransferScreen from "./pages/TransferScreen";
import "./styles/global.css";

function App() {
  const isInitialized = useSelector(
    (state: RootState) => state.wallet.isInitialized
  );
  const isUnlocked = useSelector((state: RootState) => state.wallet.isUnlocked);
  const isSettingUp = useSelector(
    (state: RootState) => state.wallet.isSettingUp
  );
  const currentPage = useSelector(
    (state: RootState) => state.wallet.currentPage
  );

  if (!isInitialized && !isSettingUp) {
    return <WelcomeScreen />;
  }

  if (!isInitialized && isSettingUp) {
    return <CreateMnemonicScreen />;
  }

  if (isInitialized && !isUnlocked) {
    return <UnlockScreen />;
  }
  switch (currentPage) {
    case "transfer":
      return <TransferScreen />;
    case "dashboard":
    default:
      return <Dashboard />;
  }
}

export default App;
