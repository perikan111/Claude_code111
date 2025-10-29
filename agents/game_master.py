"""Game Master agent implementation using Concordia."""

from typing import List, Dict, Any
from concordia.agents import basic_agent
from concordia.associative_memory import associative_memory
from concordia.components import agent as components
from concordia.language_model import language_model


class GameMaster:
    """
    Game Master agent that narrates the story and manages the game world.

    The GM is responsible for:
    - Setting the scene and describing the environment
    - Responding to player actions
    - Managing NPCs and enemies
    - Maintaining game state and world consistency
    """

    def __init__(
        self,
        name: str,
        model: language_model.LanguageModel,
        scenario_description: str,
        clock_now=None
    ):
        """
        Initialize the Game Master.

        Args:
            name: Name of the GM agent
            model: Language model for generating responses
            scenario_description: Description of the game scenario
            clock_now: Optional clock for time tracking
        """
        self.name = name
        self.model = model
        self.scenario_description = scenario_description
        self.clock_now = clock_now
        self.game_state = {
            "location": "",
            "active_npcs": [],
            "inventory": {},
            "quest_progress": {}
        }

        # Create memory for the GM
        self.memory = associative_memory.AssociativeMemory(
            sentence_embedder=lambda x: [0.0] * 384  # Placeholder
        )

        # Initialize with scenario
        self.memory.add(
            f"[GM Background] {scenario_description}",
            tags=["scenario", "background"]
        )

    def narrate_scene(self, context: str = "") -> str:
        """
        Generate a narrative description of the current scene.

        Args:
            context: Additional context for the scene

        Returns:
            Narrative description
        """
        prompt = f"""You are the Game Master of a TRPG.

Scenario: {self.scenario_description}

Current Context: {context}

Describe the current scene in an engaging way. Set the atmosphere and present
the situation to the players. Keep it concise (2-3 paragraphs).
"""

        response = self.model.sample_text(
            prompt,
            max_tokens=300
        )

        # Store in memory
        self.memory.add(
            f"[GM Narration] {response}",
            tags=["narration", "scene"]
        )

        return response

    def process_action(
        self,
        player_name: str,
        action: str,
        game_context: Dict[str, Any]
    ) -> str:
        """
        Process a player action and generate the result.

        Args:
            player_name: Name of the player taking the action
            action: Description of the action
            game_context: Current game context and state

        Returns:
            Description of the action result
        """
        # Get relevant memories
        recent_events = self.memory.retrieve_recent(k=5)

        prompt = f"""You are the Game Master of a TRPG.

Scenario: {self.scenario_description}

Recent Events:
{self._format_memories(recent_events)}

Current Situation: {game_context.get('situation', 'Continuing the adventure')}

Player Action: {player_name} attempts to {action}

As the GM, describe what happens as a result of this action. Consider:
1. Is the action successful or does it face challenges?
2. How does the world respond?
3. Are there consequences or new developments?

Keep your response concise (1-2 paragraphs) and engaging.
"""

        response = self.model.sample_text(
            prompt,
            max_tokens=250
        )

        # Store in memory
        self.memory.add(
            f"[Action] {player_name}: {action} | [Result] {response}",
            tags=["action", player_name]
        )

        return response

    def introduce_npc(self, npc_name: str, context: str = "") -> str:
        """
        Introduce a new NPC to the scene.

        Args:
            npc_name: Name of the NPC
            context: Context for the introduction

        Returns:
            Description of the NPC
        """
        prompt = f"""You are the Game Master. Introduce an NPC named {npc_name}.

Scenario: {self.scenario_description}
Context: {context}

Describe the NPC's appearance, demeanor, and initial interaction with the players.
Keep it brief (1 paragraph).
"""

        response = self.model.sample_text(
            prompt,
            max_tokens=150
        )

        self.memory.add(
            f"[NPC] {npc_name}: {response}",
            tags=["npc", npc_name]
        )

        return response

    def _format_memories(self, memories: List[Any]) -> str:
        """Format a list of memories for display."""
        if not memories:
            return "The adventure begins..."
        return "\n".join([f"- {mem}" for mem in memories])

    def get_available_actions(self, context: str = "") -> List[str]:
        """
        Suggest possible actions for players.

        Args:
            context: Current context

        Returns:
            List of suggested actions
        """
        return [
            "Explore the area",
            "Talk to NPCs",
            "Search for items",
            "Attack/Defend",
            "Use skill/magic",
            "Custom action"
        ]

    def update_game_state(self, key: str, value: Any):
        """Update the game state."""
        self.game_state[key] = value
        self.memory.add(
            f"[State Update] {key}: {value}",
            tags=["state", key]
        )
