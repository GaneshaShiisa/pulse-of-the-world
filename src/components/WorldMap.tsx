import React, { useMemo, useEffect } from "react";
import * as d3 from "d3";
import * as d3GeoProj from "d3-geo-projection";
import { geoPath } from "d3-geo";

// 1. 地図データの型定義
interface GeoData {
  features: any[];
}

// 1. 太陽の位置（正午の経度）を計算する関数
const getSolarRotation = (date: Date = new Date()) => {
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();

  // UTC 12:00 を 0度（中心）とする
  // 1時間で15度、1分で0.25度。
  // 西へ進むので、UTC 13:00 なら太陽は -15度（西経15度）にいる。
  const solarLongitude = -(
    (utcHours - 12) * 15 +
    utcMinutes * 0.25 +
    utcSeconds * (0.25 / 60)
  );

  return solarLongitude;
};

// 2. 太陽の赤緯（仰角）を計算する関数
const getSolarDeclination = (date: Date = new Date()) => {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const phi = (2 * Math.PI * (dayOfYear - 80)) / 365.25;
  return 0.4093 * Math.sin(phi); // 赤緯（ラジアン）
};

// 現在時刻から「夜のポリゴン」を生成する関数
const getNightPolygon = (date: Date = new Date()): any => {
  const solarLon = getSolarRotation(date);
  const solarLat = getSolarDeclination(date) * (180 / Math.PI);

  // アンチサン（夜側中心点）
  let n_lon = solarLon + 180;
  if (n_lon > 180) n_lon -= 360;
  if (n_lon < -180) n_lon += 360;
  const n_lat = -solarLat;

  // 1日の夜域は半球なので、radius=90を指定
  const nightPolygon = d3
    .geoCircle()
    .center([n_lon, n_lat])
    .radius(89)
    .precision(0.5)();

  return nightPolygon;
};

const WorldMap: React.FC = () => {
  // 本来は外部ファイルから読み込みますが、まずはURLから取得する想定で型だけ定義
  const [geoData, setGeoData] = React.useState<GeoData | null>(null);
  const [simDate, setSimDate] = React.useState<Date>(new Date());
  const [rotation, setRotation] = React.useState<number>(
    getSolarRotation(simDate),
  ); // 自転の角度

  // 主要な観測地点のデータ
  const LOCATIONS = [
    { name: "Tokyo", coords: [139.69, 35.68] },
    { name: "New York", coords: [-74.0, 40.71] },
    { name: "London", coords: [-0.12, 51.5] },
    { name: "Paris", coords: [2.35, 48.85] },
    { name: "Sydney", coords: [151.2, -33.86] },
    { name: "Sao Paulo", coords: [-46.63, -23.55] },
  ];

  React.useEffect(() => {
    d3.json("countries.geojson").then((data: any) => setGeoData(data));
  }, []);

  // アニメーションループ：実時間で更新（パフォーマンス最適化）
  useEffect(() => {
    let requestRef: number;
    let lastUpdate = 0;

    const animate = (timestamp: number) => {
      // 1分に1回だけ更新（60000ms）
      if (timestamp - lastUpdate >= 60000) {
        const nextDate = new Date();
        setSimDate(nextDate);
        setRotation(getSolarRotation(nextDate));
        lastUpdate = timestamp;
      }

      requestRef = requestAnimationFrame(animate);
    };

    requestRef = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef);
  }, []);

  // 描画計算
  const chart = useMemo(() => {
    if (!geoData) return null;

    const width = 800;
    const height = 450;

    // ヴィンケル第3図法の設定
    const projection = d3GeoProj
      .geoWinkel3()
      .scale(150)
      .translate([width / 2, height / 2])
      .rotate([-rotation, 0]);

    const pathGenerator = geoPath().projection(projection);

    // -10度から40度の範囲を、ディープブルーから赤っぽく変換するスケール
    const colorScale = d3
      .scaleSequential()
      .domain([-10, 40]) // 温度の範囲
      .interpolator(d3.interpolateRgbBasis(["#0000ff", "#00ffff", "#ff0000"])); // 青 -> 水色 -> 赤

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* SVG フィルタの定義 */}
        <defs>
          <filter
            id="night-shadow-blur"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            {/* 影を少し外側に広げてからぼかすことで、境界線を柔らかくする */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
        </defs>

        <path d={pathGenerator({ type: "Sphere" }) || ""} fill="#000015" />
        <g className="countries">
          {geoData.features.map((feature, i) => {
            const dummyTemp = ((i * 7) % 50) - 10;
            const countryColor = colorScale(dummyTemp);
            return (
              <path
                key={i}
                d={pathGenerator(feature) || ""}
                style={{
                  fill: countryColor,
                  fillOpacity: 0.8,
                }}
              />
            );
          })}
        </g>
        <g className="night-layer">
          {(() => {
            const nightFeature = getNightPolygon(simDate);
            const nightPath = pathGenerator(nightFeature as any);

            if (!nightPath) return null;

            return (
              <path
                d={nightPath}
                fill="rgba(0, 10, 40, 0.6)" // ぼかすので、少し濃いめがおすすめです
                style={{
                  filter: "url(#night-shadow-blur)",
                  pointerEvents: "none",
                }}
              />
            );
          })()}
        </g>
        <g className="locations">
          {(() => {
            // 1. 現在の夜のポリゴンを取得
            const nightFeature = getNightPolygon(simDate);

            return LOCATIONS.map((loc, i) => {
              const coords = loc.coords as [number, number];
              const xy = projection(coords);
              if (!xy) return null;

              // 2. d3.geoContains で座標が夜のポリゴン内にあるか厳密に判定
              // ※ getNightPolygon が返す Feature オブジェクトを使います
              const isNight = d3.geoContains(nightFeature as any, coords);

              // 色の定義（可視性を考慮して、昼は白、夜はシアンに）
              const activeColor = isNight ? "#ffcc00" : "#ccffff";

              return (
                <g key={`loc-${i}`} transform={`translate(${xy[0]}, ${xy[1]})`}>
                  <circle r="2.5" fill={activeColor} />
                  <circle
                    r="4"
                    fill="none"
                    stroke={activeColor}
                    strokeWidth="1"
                    className="echo-ring"
                    style={{
                      animationDelay: `${i * 0.4}s`,
                    }}
                  />

                  <rect
                    x="3"
                    y="-14"
                    width={loc.name.length * 6} // 文字数に合わせて可変
                    height="10"
                    fill="rgba(0, 0, 0, 0.4)"
                    rx="2" // 角を少し丸める
                  />
                  <text
                    x="5"
                    y="-5"
                    fill={activeColor}
                    fontSize="8px"
                    fontFamily="'Courier New', Courier, monospace"
                    style={{
                      textShadow: "0 0 5px rgba(0,0,0,0.8)",
                      opacity: 0.8,
                      pointerEvents: "none",
                    }}
                  >
                    {loc.name.toUpperCase()}
                  </text>
                </g>
              );
            });
          })()}
        </g>
      </svg>
    );
  }, [geoData, rotation]);

  if (!geoData) return <div>Loading Worlds...</div>;

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {chart}
    </div>
  );
};

export default WorldMap;
