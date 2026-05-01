import streamlit as st
import json
import os
import pandas as pd

from analytics.aggregator import (
    aggregate_metrics,
    aggregate_tone_by_stage
)

DATA_FILE = "data/responses_with_sentiment.json"

st.title("SOLE — AI Brand Influence Monitor")

if not os.path.exists(DATA_FILE):
    st.error("Enriched dataset not found.")
    st.stop()

with open(DATA_FILE, "r") as f:
    data = json.load(f)

# ---------- STAGE FILTER ----------
st.sidebar.header("Filter")
stages = list(set(entry["stage"] for entry in data))
selected_stage = st.sidebar.selectbox("Select Funnel Stage", ["All"] + stages)

if selected_stage != "All":
    filtered_data = [entry for entry in data if entry["stage"] == selected_stage]
else:
    filtered_data = data

# ---------- BRAND METRICS ----------
total_mentions, first_mentions, stage_mentions = aggregate_metrics(filtered_data)

st.header("AI Share of Voice")
df_total = pd.DataFrame(total_mentions.items(), columns=["Brand", "Mentions"])
st.bar_chart(df_total.set_index("Brand"))

st.header("First Mention Rate")
df_first = pd.DataFrame(first_mentions.items(), columns=["Brand", "First Mentions"])
st.bar_chart(df_first.set_index("Brand"))

# ---------- STAGE DOMINANCE ----------
st.header("Stage Dominance")

for stage, brands in stage_mentions.items():
    st.subheader(stage)
    df_stage = pd.DataFrame(brands.items(), columns=["Brand", "Mentions"])
    st.bar_chart(df_stage.set_index("Brand"))

# ---------- TONE DISTRIBUTION ----------
st.header("Tone Distribution by Stage")

tone_distribution = aggregate_tone_by_stage(filtered_data)

for stage, tones in tone_distribution.items():
    st.subheader(stage)
    df_tone = pd.DataFrame(tones.items(), columns=["Tone", "Count"])
    st.bar_chart(df_tone.set_index("Tone"))