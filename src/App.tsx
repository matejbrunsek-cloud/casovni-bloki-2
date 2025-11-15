import React, { useEffect, useState } from "react";

type Season = "VISOKA" | "NIZKA";
type DayType = "DELOVNI_DAN" | "DELA_PROST_DAN";

interface BlockInterval {
  block: number;
  startHour: number;
  endHour: number;
}

interface DailySchedule {
  season: Season;
  dayType: DayType;
  intervals: BlockInterval[];
}

interface BlockInstance {
  season: Season;
  dayType: DayType;
  block: number;
  start: Date;
  end: Date;
}

// ---------- CENE BLOKOV ----------

const BLOCK_PRICES: Record<number, number> = {
  1: 1.71,
  2: 0.91,
  3: 0.16,
  4: 0.004,
  5: 0,
};

function formatPrice(block: number): string {
  const price = BLOCK_PRICES[block] ?? 0;
  if (price === 0) return "0 €";
  return price.toFixed(3).replace(".", ",") + " €";
}

// ---------- SEZONA & TIP DNEVA ----------

function getSeason(date: Date): Season {
  const month = date.getMonth() + 1; // 1–12
  if (month === 11 || month === 12 || month === 1 || month === 2) {
    return "VISOKA"; // november–februar
  }
  return "NIZKA"; // marec–oktober
}

function getDayType(date: Date): DayType {
  const day = date.getDay(); // 0 nedelja, 6 sobota
  return day === 0 || day === 6 ? "DELA_PROST_DAN" : "DELOVNI_DAN";
}

// ---------- DEFINICIJA URNIH BLOKOV ----------

const SCHEDULE: Record<Season, Record<DayType, BlockInterval[]>> = {
  VISOKA: {
    DELOVNI_DAN: [
      { block: 3, startHour: 0, endHour: 6 },
      { block: 2, startHour: 6, endHour: 7 },
      { block: 1, startHour: 7, endHour: 14 },
      { block: 2, startHour: 14, endHour: 16 },
      { block: 1, startHour: 16, endHour: 20 },
      { block: 2, startHour: 20, endHour: 22 },
      { block: 3, startHour: 22, endHour: 24 },
    ],
    DELA_PROST_DAN: [
      { block: 4, startHour: 0, endHour: 6 },
      { block: 3, startHour: 6, endHour: 7 },
      { block: 2, startHour: 7, endHour: 14 },
      { block: 3, startHour: 14, endHour: 16 },
      { block: 2, startHour: 16, endHour: 20 },
      { block: 3, startHour: 20, endHour: 22 },
      { block: 4, startHour: 22, endHour: 24 },
    ],
  },
  NIZKA: {
    DELOVNI_DAN: [
      { block: 4, startHour: 0, endHour: 6 },
      { block: 3, startHour: 6, endHour: 7 },
      { block: 2, startHour: 7, endHour: 14 },
      { block: 3, startHour: 14, endHour: 16 },
      { block: 2, startHour: 16, endHour: 20 },
      { block: 3, startHour: 20, endHour: 22 },
      { block: 4, startHour: 22, endHour: 24 },
    ],
    DELA_PROST_DAN: [
      { block: 5, startHour: 0, endHour: 6 },
      { block: 4, startHour: 6, endHour: 7 },
      { block: 3, startHour: 7, endHour: 14 },
      { block: 4, startHour: 14, endHour: 16 },
      { block: 3, startHour: 16, endHour: 20 },
      { block: 4, startHour: 20, endHour: 22 },
      { block: 5, startHour: 22, endHour: 24 },
    ],
  },
};

function getDailySchedule(date: Date): DailySchedule {
  const season = getSeason(date);
  const dayType = getDayType(date);

  return {
    season,
    dayType,
    intervals: SCHEDULE[season][dayType],
  };
}

// ---------- FUNKCIJE ZA BLOKE ----------

function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function buildInstance(
  baseDate: Date,
  season: Season,
  dayType: DayType,
  interval: BlockInterval
): BlockInstance {
  const start = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    interval.startHour,
    0,
    0
  );
  const end = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    interval.endHour,
    0,
    0
  );
  return {
    season,
    dayType,
    block: interval.block,
    start,
    end,
  };
}

export function getCurrentBlock(date: Date): BlockInstance | null {
  const schedule = getDailySchedule(date);
  const nowMin = minutesFromMidnight(date);

  for (const interval of schedule.intervals) {
    const startMin = interval.startHour * 60;
    const endMin = interval.endHour * 60;
    if (nowMin >= startMin && nowMin < endMin) {
      return buildInstance(date, schedule.season, schedule.dayType, interval);
    }
  }
  return null;
}

export function getNextBlock(date: Date): BlockInstance | null {
  const schedule = getDailySchedule(date);
  const nowMin = minutesFromMidnight(date);

  let currentIndex = schedule.intervals.findIndex((i) => {
    const startMin = i.startHour * 60;
    const endMin = i.endHour * 60;
    return nowMin >= startMin && nowMin < endMin;
  });

  if (currentIndex === -1) {
    currentIndex = schedule.intervals.findIndex(
      (i) => i.startHour * 60 > nowMin
    );
    if (currentIndex === -1) currentIndex = 0;
  }

  if (currentIndex < schedule.intervals.length - 1) {
    return buildInstance(
      date,
      schedule.season,
      schedule.dayType,
      schedule.intervals[currentIndex + 1]
    );
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDaySchedule = getDailySchedule(tomorrow);
  return buildInstance(
    tomorrow,
    nextDaySchedule.season,
    nextDaySchedule.dayType,
    nextDaySchedule.intervals[0]
  );
}

// ---------- POMOČNE FUNKCIJE ----------

function formatTime(d: Date): string {
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function translateSeason(season: Season): string {
  return season === "VISOKA" ? "Visoka sezona" : "Nizka sezona";
}

function translateDayType(dayType: DayType): string {
  return dayType === "DELOVNI_DAN" ? "Delovni dan" : "Dela prost dan";
}

// ---------- TABELA ZA EN DAN (S CENO BLOKA) ----------

const DaySchedule: React.FC<{ date: Date }> = ({ date }) => {
  const schedule = getDailySchedule(date);

  const dateLabel = date.toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      style={{
        marginBottom: "16px",
        backgroundColor: "#4b5563", // temno siva
        padding: "12px",
        borderRadius: "12px",
        color: "white",
        width: "100%",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "15px" }}>
        {dateLabel}
      </div>

      <div style={{ fontSize: "12px", marginBottom: "10px", color: "white" }}>
        {translateSeason(schedule.season)} • {translateDayType(schedule.dayType)}
      </div>

      <table style={{ width: "100%", fontSize: "14px", color: "white" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", paddingBottom: "4px" }}>Blok</th>
            <th style={{ textAlign: "left", paddingBottom: "4px" }}>Od</th>
            <th style={{ textAlign: "left", paddingBottom: "4px" }}>Do</th>
            <th style={{ textAlign: "left", paddingBottom: "4px" }}>Cena</th>
          </tr>
        </thead>

        <tbody>
          {schedule.intervals.map((interval, idx) => (
            <tr key={idx}>
              <td style={{ padding: "4px 0" }}>{interval.block}</td>
              <td style={{ padding: "4px 0" }}>
                {interval.startHour.toString().padStart(2, "0")}:00
              </td>
              <td style={{ padding: "4px 0" }}>
                {interval.endHour.toString().padStart(2, "0")}:00
              </td>
              <td style={{ padding: "4px 0" }}>
                {formatPrice(interval.block)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------- DANES + JUTRI ----------

const TwoDaySchedule: React.FC<{ now: Date }> = ({ now }) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div style={{ marginTop: "24px", width: "100%" }}>
      <DaySchedule date={today} />
      <DaySchedule date={tomorrow} />
    </div>
  );
};

// ---------- GLAVNA KOMPONENTA ----------

const App: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const current = getCurrentBlock(now);
  const next = getNextBlock(now);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        padding: "12px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "16px",
          width: "100%",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "4px",
            color: "black",
          }}
        >
          Časovni bloki – status
        </h1>

        <p style={{ fontSize: "12px", color: "black", marginBottom: "16px" }}>
          Zdaj: {now.toLocaleString("sl-SI")}
        </p>

        {/* TRENUTNI BLOK – ZELENO OZADJE */}
        {current && (
          <div
            style={{
              marginBottom: "16px",
              borderRadius: "12px",
              padding: "14px",
              backgroundColor: "#059669", // zelena
              color: "white",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "16px", marginBottom: "4px" }}>
              Trenutni blok
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              Blok {current.block}
            </div>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>
              Cena: {formatPrice(current.block)}
            </div>
            <div style={{ fontSize: "14px" }}>
              {formatTime(current.start)} – {formatTime(current.end)}
            </div>
          </div>
        )}

        {/* NASLEDNJI BLOK – MODRO OZADJE */}
        {next && (
          <div
            style={{
              marginBottom: "16px",
              borderRadius: "12px",
              padding: "14px",
              backgroundColor: "#2563eb", // modra
              color: "white",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "16px", marginBottom: "4px" }}>
              Naslednji blok
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              Blok {next.block}
            </div>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>
              Cena: {formatPrice(next.block)}
            </div>
            <div style={{ fontSize: "14px" }}>
              {formatTime(next.start)} – {formatTime(next.end)}
            </div>
          </div>
        )}

        {/* TABELI ZA DANES + JUTRI */}
        <TwoDaySchedule now={now} />
      </div>
    </div>
  );
};

export default App;
