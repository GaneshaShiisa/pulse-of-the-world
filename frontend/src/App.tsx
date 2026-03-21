import { useEffect, useState } from "react";
import io from "socket.io-client";
import WorldMap from "./components/WorldMap";
import "./App.css";

function App() {
  const [pulseData, setPulseData] = useState<{
    msg: string;
    payload: { value: any };
  } | null>(null);

  useEffect(() => {
    const socket = io("http://127.0.0.1:8000");

    socket.on("triad_pulse", (data) => {
      console.log("Pulse received:", data);
      setPulseData(data);

      // 視覚的エフェクト（例: 地図エリアにクラスを追加）
      const mapArea = document.querySelector(".map-area");
      if (mapArea) {
        mapArea.classList.remove("pulse-active");
        void (mapArea as HTMLElement).offsetWidth; // リフロー強制
        mapArea.classList.add("pulse-active");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="dashboard-container">
      {/* Layer 1 & 2: 地図エリア */}
      <div className="map-area">
        <WorldMap />
      </div>

      {/* Layer 3: ログエリア */}
      <div className="log-area">
        <div>[SYSTEM] INITIALIZING CORE...</div>
        <div>[SYSTEM] CONNECTING TO GLOBAL_PULSE...</div>
        {pulseData ? (
          <>
            <div>{pulseData.msg}</div>
            <div>Value: {pulseData.payload.value}</div>
          </>
        ) : (
          <div style={{ color: "#aaa" }}>...waiting for data...</div>
        )}
      </div>
    </div>
  );
}

export default App;
