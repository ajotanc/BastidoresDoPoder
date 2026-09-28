import config from '../../game.config.json' with { type: 'json' };
export const GAME_NAME = config.name;
export const GAME_NAME_FIRST_LINE = GAME_NAME.split(' ')[0];
export const GAME_NAME_SECOND_LINE = GAME_NAME.split(' ').slice(1).join(' ');
export const MIN_PLAYERS_TO_START = config.minPlayers;
export const MAX_PLAYERS_PER_ROOM = config.maxPlayers;

// Edite os valores em game.config.json. Tempos são expressos em segundos;
// as conversões para milissegundos ficam somente nesta camada.
export const ACTION_TIMEOUT_SECONDS = config.gameplay.actionTimeoutSeconds;
export const RESPONSE_TIMEOUT_SECONDS = config.gameplay.responseTimeoutSeconds;
export const INITIAL_COINS = config.gameplay.initialCoins;
export const DEFAULT_BOT_COUNT = config.bots.defaultCount;
export const BOT_DECISION_DELAY_MS = config.bots.decisionDelaySeconds * 1000;
export const BOT_CHALLENGE_PROBABILITY = config.bots.challengeProbability;
export const MAX_BOTS_PER_ROOM = MAX_PLAYERS_PER_ROOM - 1;
export const RECONNECT_GRACE_MS = config.connection.reconnectGraceSeconds * 1000;
export const RECONNECT_RETRY_MS = config.connection.reconnectRetrySeconds * 1000;
export const MAX_RECONNECT_ATTEMPTS = config.connection.maxReconnectAttempts;
export const HEARTBEAT_INTERVAL_MS = config.connection.heartbeatIntervalSeconds * 1000;
export const HEARTBEAT_TIMEOUT_MS = config.connection.heartbeatTimeoutSeconds * 1000;
export const CONNECTION_TIMEOUT_MS = config.connection.connectionTimeoutSeconds * 1000;
