"""Player agent implementation using Concordia."""

from typing import List, Dict, Any, Optional
from concordia.associative_memory import associative_memory
from concordia.language_model import language_model


class Player:
    """
    Player character agent with personality and decision-making.

    Each player has:
    - Unique personality traits
    - Personal goals and motivations
    - Memory of past events
    - Ability to make decisions based on context
    """

    def __init__(
        self,
        name: str,
        model: language_model.LanguageModel,
        character_class: str,
        personality: str,
        goals: List[str],
        clock_now=None
    ):
        """
        Initialize a player character.

        Args:
            name: Character name
            model: Language model for decision-making
            character_class: Character class (e.g., "Warrior", "Mage", "Rogue")
            personality: Description of personality traits
            goals: List of character goals
            clock_now: Optional clock for time tracking
        """
        self.name = name
        self.model = model
        self.character_class = character_class
        self.personality = personality
        self.goals = goals
        self.clock_now = clock_now

        # Character stats
        self.stats = {
            "health": 100,
            "mana": 50,
            "strength": 10,
            "intelligence": 10,
            "agility": 10
        }

        self.inventory = []
        self.status_effects = []

        # Create memory
        self.memory = associative_memory.AssociativeMemory(
            sentence_embedder=lambda x: [0.0] * 384  # Placeholder
        )

        # Initialize with character background
        self.memory.add(
            f"I am {name}, a {character_class}. {personality}",
            tags=["background", "self"]
        )

        for goal in goals:
            self.memory.add(
                f"[Goal] {goal}",
                tags=["goal"]
            )

    def decide_action(
        self,
        situation: str,
        available_actions: List[str],
        gm_context: str = ""
    ) -> Dict[str, str]:
        """
        Decide what action to take based on the current situation.

        Args:
            situation: Description of the current situation
            available_actions: List of possible actions
            gm_context: Additional context from the GM

        Returns:
            Dictionary with 'action' and 'reasoning'
        """
        # Get relevant memories
        recent_memories = self.memory.retrieve_recent(k=5)

        prompt = f"""You are {self.name}, a {self.character_class}.

Your Personality: {self.personality}

Your Goals:
{self._format_list(self.goals)}

Recent Experiences:
{self._format_memories(recent_memories)}

Current Situation: {situation}
{gm_context}

Available Actions:
{self._format_list(available_actions)}

Based on your personality and goals, what action do you take?
Respond in this format:
ACTION: [your chosen action or describe a custom action]
REASONING: [brief explanation of why you chose this]
"""

        response = self.model.sample_text(
            prompt,
            max_tokens=200
        )

        # Parse response
        action_text, reasoning = self._parse_action_response(response)

        # Store decision in memory
        self.memory.add(
            f"[Action] In response to: {situation[:100]}... I decided to: {action_text}",
            tags=["action", "decision"]
        )

        return {
            "action": action_text,
            "reasoning": reasoning
        }

    def roleplay_dialogue(
        self,
        context: str,
        speaking_to: str = "the party"
    ) -> str:
        """
        Generate in-character dialogue.

        Args:
            context: Context for the dialogue
            speaking_to: Who the character is speaking to

        Returns:
            Dialogue text
        """
        recent_memories = self.memory.retrieve_recent(k=3)

        prompt = f"""You are {self.name}, a {self.character_class}.

Your Personality: {self.personality}

Recent Events:
{self._format_memories(recent_memories)}

Context: {context}

You are speaking to {speaking_to}. What do you say?
Keep it in character and concise (1-2 sentences).
Respond with only the dialogue, no labels or formatting.
"""

        response = self.model.sample_text(
            prompt,
            max_tokens=100
        )

        # Store in memory
        self.memory.add(
            f"[Dialogue] To {speaking_to}: {response}",
            tags=["dialogue", speaking_to]
        )

        return response.strip()

    def react_to_event(self, event: str) -> str:
        """
        Generate a reaction to an event.

        Args:
            event: Description of the event

        Returns:
            Reaction text
        """
        self.memory.add(
            f"[Event] {event}",
            tags=["event", "observation"]
        )

        prompt = f"""You are {self.name}, a {self.character_class}.
Your Personality: {self.personality}

An event occurs: {event}

How do you react? (Brief emotional/physical reaction, 1 sentence)
"""

        response = self.model.sample_text(
            prompt,
            max_tokens=50
        )

        return response.strip()

    def update_stats(self, stat: str, change: int):
        """Update character stats."""
        if stat in self.stats:
            self.stats[stat] += change
            self.memory.add(
                f"[Stats] {stat} changed by {change} (now: {self.stats[stat]})",
                tags=["stats", stat]
            )

    def add_item(self, item: str):
        """Add item to inventory."""
        self.inventory.append(item)
        self.memory.add(
            f"[Item] Acquired: {item}",
            tags=["inventory", "item"]
        )

    def get_character_sheet(self) -> str:
        """Get a formatted character sheet."""
        sheet = f"""
=== {self.name} ===
Class: {self.character_class}
Personality: {self.personality}

Stats:
  Health: {self.stats['health']}
  Mana: {self.stats['mana']}
  Strength: {self.stats['strength']}
  Intelligence: {self.stats['intelligence']}
  Agility: {self.stats['agility']}

Goals:
{self._format_list(self.goals, indent=2)}

Inventory: {', '.join(self.inventory) if self.inventory else 'Empty'}

Status Effects: {', '.join(self.status_effects) if self.status_effects else 'None'}
"""
        return sheet

    def _format_list(self, items: List[str], indent: int = 0) -> str:
        """Format a list of items."""
        prefix = " " * indent
        return "\n".join([f"{prefix}- {item}" for item in items])

    def _format_memories(self, memories: List[Any]) -> str:
        """Format memories for display."""
        if not memories:
            return "This is the beginning of my adventure..."
        return "\n".join([f"- {mem}" for mem in memories])

    def _parse_action_response(self, response: str) -> tuple:
        """Parse the action and reasoning from model response."""
        action = ""
        reasoning = ""

        lines = response.strip().split("\n")
        for line in lines:
            if line.startswith("ACTION:"):
                action = line.replace("ACTION:", "").strip()
            elif line.startswith("REASONING:"):
                reasoning = line.replace("REASONING:", "").strip()

        # If parsing fails, use the whole response as action
        if not action:
            action = response.strip()
            reasoning = "Following my instincts"

        return action, reasoning
