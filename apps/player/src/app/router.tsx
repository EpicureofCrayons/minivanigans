import { createHashRouter } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { Dashboard } from "../screens/Dashboard";
import { CardLibrary } from "../screens/CardLibrary";
import { CardBuilder } from "../screens/CardBuilder";
import { DeckBuilder } from "../screens/DeckBuilder";
import { PrintExport } from "../screens/PrintExport";
import { CardBacks } from "../screens/CardBacks";
import { TokenPrint } from "../screens/TokenPrint";
import { PrinterCalibration } from "../screens/PrinterCalibration";
import { PlaySetup } from "../screens/PlaySetup";
import { PlayMatch } from "../screens/PlayMatch";
import { RulesPrint } from "../screens/RulesPrint";
import { Playmat } from "../screens/Playmat";
import { Profile } from "../screens/Profile";
import { AvatarCreator } from "../screens/AvatarCreator";
import { LanyardPrint } from "../screens/LanyardPrint";
import { ImportShare } from "../screens/ImportShare";
import { Settings } from "../screens/Settings";

// HashRouter keeps client-side routing working when the app is served from the
// Tauri asset protocol in a production build.
export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "library", element: <CardLibrary /> },
      { path: "builder", element: <CardBuilder /> },
      { path: "builder/:id", element: <CardBuilder /> },
      { path: "decks", element: <DeckBuilder /> },
      { path: "play", element: <PlaySetup /> },
      { path: "play/match", element: <PlayMatch /> },
      { path: "print", element: <PrintExport /> },
      { path: "card-backs", element: <CardBacks /> },
      { path: "tokens", element: <TokenPrint /> },
      { path: "calibrate", element: <PrinterCalibration /> },
      { path: "rules", element: <RulesPrint /> },
      { path: "playmat", element: <Playmat /> },
      { path: "profile", element: <Profile /> },
      { path: "avatar", element: <AvatarCreator /> },
      { path: "lanyard", element: <LanyardPrint /> },
      { path: "import-share", element: <ImportShare /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
