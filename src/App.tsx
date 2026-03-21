import WorldMap from "./components/WorldMap";
import "./App.css";

function App() {
  return (
    <div className="dashboard-container">
      {/* Layer 1 & 2: 地図エリア */}
      <div className="map-area">
        <WorldMap />
      </div>

      {/* Layer 3: ログエリア（今はまだ枠だけ） */}
      <div className="log-area">
        <div>[SYSTEM] INITIALIZING CORE...</div>
        <div>[SYSTEM] CONNECTING TO GLOBAL_PULSE...</div>
        <div style={{ color: "#aaa" }}>...waiting for data...</div>
      </div>
    </div>
  );
}

export default App;
