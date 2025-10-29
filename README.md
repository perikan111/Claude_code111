# TRPG Game with Google Concordia

A tabletop role-playing game (TRPG) implementation using Google's Concordia framework for multi-agent simulation.

## Overview

This project uses Concordia to create an interactive TRPG experience with:
- AI-powered Game Master (GM)
- Multiple player characters with distinct personalities
- Dynamic storytelling and world simulation
- Memory and context-aware agents

## Features

- **Game Master Agent**: Narrates the story, manages world state, and responds to player actions
- **Player Agents**: Each with unique personalities, goals, and decision-making
- **World Simulation**: Dynamic environment that responds to player actions
- **Memory System**: Agents remember past events and interactions
- **Flexible Scenarios**: Easy to create custom adventures

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python main.py
```

## Project Structure

```
├── main.py                 # Main game loop
├── agents/
│   ├── game_master.py     # GM agent implementation
│   └── player.py          # Player agent implementation
├── scenarios/
│   └── fantasy_quest.py   # Example scenario
├── requirements.txt       # Dependencies
└── README.md             # This file
```

## Requirements

- Python 3.10+
- Google Concordia
- Anthropic Claude API or OpenAI API (for LLM backend)

## License

MIT
