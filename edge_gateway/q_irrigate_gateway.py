"""
Q-IRRIGATE — Edge Telemetry Gateway Simulator (IoT Field Station)
==================================================================
Simulates real-world agricultural IoT sensors (capacitive soil probe,
thermistor, pyranometer, pump relay, water flow meter) streaming live
data to the Q-IRRIGATE Django REST API and Next.js Live Monitoring dashboard.
"""

import json
import random
import sys
import threading
import time
import urllib.error
import urllib.request
import tkinter as tk
from tkinter import ttk, messagebox

# Default API Target
DEFAULT_API_URL = "http://127.0.0.1:8000/api/telemetry/"

class EdgeGatewayApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Q-IRRIGATE — Field Telemetry Edge Gateway")
        self.root.geometry("640x720")
        self.root.minsize(580, 680)
        self.root.configure(bg="#061D13")

        self.is_streaming = False
        self.stream_thread = None

        # Data variables
        self.api_url_var = tk.StringVar(value=DEFAULT_API_URL)
        self.gateway_id_var = tk.StringVar(value="GW-AGRI-01")
        self.zone_var = tk.StringVar(value="Zone A")
        self.pump_status_var = tk.StringVar(value="Running")

        self.soil_moisture_var = tk.DoubleVar(value=68.4)
        self.temp_var = tk.DoubleVar(value=36.8)
        self.solar_power_var = tk.DoubleVar(value=1.41)
        self.water_flow_var = tk.DoubleVar(value=500.0)
        self.energy_var = tk.DoubleVar(value=1.50)
        self.health_var = tk.DoubleVar(value=99.8)

        self._build_ui()

    def _build_ui(self):
        # 1. Header Banner
        header = tk.Frame(self.root, bg="#092619", pady=14, padx=18)
        header.pack(fill="x")

        title = tk.Label(
            header,
            text="Q-IRRIGATE  |  IoT Edge Telemetry Gateway",
            font=("Segoe UI", 14, "bold"),
            fg="#FFFFFF",
            bg="#092619"
        )
        title.pack(anchor="w")

        subtitle = tk.Label(
            header,
            text="Simulated LoRaWAN Field Station • Solar Agri-Tech Field Station",
            font=("Segoe UI", 9),
            fg="#6EE7B7",
            bg="#092619"
        )
        subtitle.pack(anchor="w", pady=(2, 0))

        # 2. Main Content Frame (Scrollable or Padded)
        body = tk.Frame(self.root, bg="#061D13", padx=18, pady=12)
        body.pack(fill="both", expand=True)

        # Config Panel
        cfg_frame = tk.LabelFrame(
            body,
            text=" Station Configuration ",
            font=("Segoe UI", 9, "bold"),
            fg="#A7F3D0",
            bg="#0B2C1D",
            padx=12,
            pady=8
        )
        cfg_frame.pack(fill="x", pady=(0, 10))

        # API URL row
        url_row = tk.Frame(cfg_frame, bg="#0B2C1D")
        url_row.pack(fill="x", pady=2)
        tk.Label(url_row, text="Target API:", font=("Segoe UI", 9), fg="#D1D5DB", bg="#0B2C1D", width=12, anchor="w").pack(side="left")
        tk.Entry(url_row, textvariable=self.api_url_var, font=("Consolas", 9), bg="#061D13", fg="#FFFFFF", insertbackground="white").pack(side="left", fill="x", expand=True, padx=4)

        # Gateway ID & Zone row
        gw_row = tk.Frame(cfg_frame, bg="#0B2C1D")
        gw_row.pack(fill="x", pady=2)
        tk.Label(gw_row, text="Gateway ID:", font=("Segoe UI", 9), fg="#D1D5DB", bg="#0B2C1D", width=12, anchor="w").pack(side="left")
        tk.Entry(gw_row, textvariable=self.gateway_id_var, font=("Segoe UI", 9), bg="#061D13", fg="#FFFFFF", width=16, insertbackground="white").pack(side="left", padx=4)

        tk.Label(gw_row, text="Active Zone:", font=("Segoe UI", 9), fg="#D1D5DB", bg="#0B2C1D").pack(side="left", padx=(10, 4))
        zone_combo = ttk.Combobox(gw_row, textvariable=self.zone_var, values=["Zone A", "Zone B"], width=10, state="readonly")
        zone_combo.pack(side="left")

        # 3. Sensor Sliders Panel
        sensor_frame = tk.LabelFrame(
            body,
            text=" Live Sensor Telemetry Controls ",
            font=("Segoe UI", 9, "bold"),
            fg="#A7F3D0",
            bg="#0B2C1D",
            padx=12,
            pady=10
        )
        sensor_frame.pack(fill="x", pady=(0, 10))

        self._create_slider_row(sensor_frame, "Soil Moisture (%):", self.soil_moisture_var, 10.0, 100.0, 0.1, "%")
        self._create_slider_row(sensor_frame, "Temperature (°C):", self.temp_var, 15.0, 50.0, 0.1, "°C")
        self._create_slider_row(sensor_frame, "Solar PV Power (kW):", self.solar_power_var, 0.0, 3.0, 0.01, "kW")
        self._create_slider_row(sensor_frame, "Water Flow (L/h):", self.water_flow_var, 0.0, 1200.0, 10.0, "L/h")
        self._create_slider_row(sensor_frame, "Pump Power (kW):", self.energy_var, 0.0, 3.0, 0.05, "kW")

        # Pump toggle row
        pump_row = tk.Frame(sensor_frame, bg="#0B2C1D")
        pump_row.pack(fill="x", pady=4)
        tk.Label(pump_row, text="Pump Relay State:", font=("Segoe UI", 9), fg="#D1D5DB", bg="#0B2C1D", width=20, anchor="w").pack(side="left")
        tk.Radiobutton(pump_row, text="Running", variable=self.pump_status_var, value="Running", bg="#0B2C1D", fg="#34D399", selectcolor="#061D13", font=("Segoe UI", 9, "bold")).pack(side="left", padx=4)
        tk.Radiobutton(pump_row, text="Idle / Off", variable=self.pump_status_var, value="Idle", bg="#0B2C1D", fg="#F87171", selectcolor="#061D13", font=("Segoe UI", 9)).pack(side="left", padx=4)

        # 4. Action Buttons
        btn_frame = tk.Frame(body, bg="#061D13")
        btn_frame.pack(fill="x", pady=(0, 10))

        self.stream_btn = tk.Button(
            btn_frame,
            text="▶ Start Live Auto-Streaming (every 2.5s)",
            font=("Segoe UI", 10, "bold"),
            bg="#10B981",
            fg="#FFFFFF",
            activebackground="#059669",
            activeforeground="#FFFFFF",
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2",
            command=self.toggle_stream
        )
        self.stream_btn.pack(side="left", expand=True, fill="x", padx=(0, 6))

        self.single_btn = tk.Button(
            btn_frame,
            text="⚡ Send Single Packet",
            font=("Segoe UI", 9, "bold"),
            bg="#14432C",
            fg="#A7F3D0",
            activebackground="#0E3523",
            activeforeground="#FFFFFF",
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2",
            command=self.send_single_packet
        )
        self.single_btn.pack(side="left", padx=(6, 0))

        # 5. Transmission Log Window
        log_frame = tk.LabelFrame(
            body,
            text=" Gateway Transmission Activity Log ",
            font=("Segoe UI", 9, "bold"),
            fg="#A7F3D0",
            bg="#0B2C1D",
            padx=8,
            pady=6
        )
        log_frame.pack(fill="both", expand=True)

        self.log_text = tk.Text(
            log_frame,
            height=8,
            bg="#030E09",
            fg="#34D399",
            font=("Consolas", 8),
            insertbackground="white",
            relief="flat"
        )
        scrollbar = tk.Scrollbar(log_frame, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.log_text.pack(fill="both", expand=True)

        self.log("Edge Telemetry Gateway ready. Target: " + DEFAULT_API_URL)

    def _create_slider_row(self, parent, label_text, var, from_, to, resolution, unit):
        row = tk.Frame(parent, bg="#0B2C1D")
        row.pack(fill="x", pady=2)

        tk.Label(row, text=label_text, font=("Segoe UI", 9), fg="#D1D5DB", bg="#0B2C1D", width=20, anchor="w").pack(side="left")

        val_label = tk.Label(row, text=f"{var.get():.1f} {unit}", font=("Segoe UI", 9, "bold"), fg="#FCD34D", bg="#0B2C1D", width=10, anchor="e")

        def on_change(val):
            val_label.config(text=f"{float(val):.1f} {unit}")

        scale = tk.Scale(
            row,
            from_=from_,
            to=to,
            resolution=resolution,
            orient="horizontal",
            variable=var,
            showvalue=0,
            command=on_change,
            bg="#0B2C1D",
            fg="#FFFFFF",
            highlightthickness=0,
            troughcolor="#061D13",
            activebackground="#10B981"
        )
        scale.pack(side="left", fill="x", expand=True, padx=6)
        val_label.pack(side="left")

    def log(self, message):
        timestamp = time.strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)

    def get_current_packet(self):
        return {
            "soil_moisture": round(self.soil_moisture_var.get(), 1),
            "temperature": round(self.temp_var.get(), 1),
            "pump_status": self.pump_status_var.get(),
            "water_flow": round(self.water_flow_var.get(), 1),
            "energy_meter": round(self.energy_var.get(), 2),
            "device_health": round(self.health_var.get(), 1),
            "solar_power": round(self.solar_power_var.get(), 2),
            "gateway_id": self.gateway_id_var.get(),
            "zone_active": self.zone_var.get(),
        }

    def transmit_packet(self):
        packet = self.get_current_packet()
        url = self.api_url_var.get().strip()

        try:
            payload = json.dumps(packet).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    self.root.after(0, self.log, f"TX OK: {packet['zone_active']} | Soil={packet['soil_moisture']}% | Temp={packet['temperature']}°C | Pump={packet['pump_status']}")
                else:
                    self.root.after(0, self.log, f"WARN: HTTP {resp.status}")
        except Exception as err:
            self.root.after(0, self.log, f"ERROR: Failed to reach API ({err})")

    def send_single_packet(self):
        threading.Thread(target=self.transmit_packet, daemon=True).start()

    def toggle_stream(self):
        if not self.is_streaming:
            self.is_streaming = True
            self.stream_btn.config(
                text="■ Stop Auto-Streaming",
                bg="#EF4444",
                activebackground="#DC2626"
            )
            self.log("Auto-streaming started (transmitting every 2.5s with micro-sensor jitter)")
            self.stream_thread = threading.Thread(target=self._stream_loop, daemon=True)
            self.stream_thread.start()
        else:
            self.is_streaming = False
            self.stream_btn.config(
                text="▶ Start Live Auto-Streaming (every 2.5s)",
                bg="#10B981",
                activebackground="#059669"
            )
            self.log("Auto-streaming stopped.")

    def _stream_loop(self):
        while self.is_streaming:
            # Apply subtle realistic sensor jitter (+/- 0.15% moisture, +/- 0.1°C temp)
            m = max(10.0, min(100.0, self.soil_moisture_var.get() + random.uniform(-0.2, 0.2)))
            t = max(15.0, min(50.0, self.temp_var.get() + random.uniform(-0.1, 0.1)))
            s = max(0.0, min(3.0, self.solar_power_var.get() + random.uniform(-0.02, 0.02)))

            self.soil_moisture_var.set(round(m, 1))
            self.temp_var.set(round(t, 1))
            self.solar_power_var.set(round(s, 2))

            self.transmit_packet()
            time.sleep(2.5)


def main():
    root = tk.Tk()
    app = EdgeGatewayApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
