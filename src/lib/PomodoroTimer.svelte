<script lang="ts">
  import { onMount } from 'svelte';

  const chromeApi = (globalThis as any).chrome;

  export let onTimerUpdate: (timeLeft: number, isRunning: boolean, mode: 'work' | 'break') => void = () => {};

  let timeLeft = 25 * 60;
  let isRunning = false;
  let mode: 'work' | 'break' = 'work';
  let completedPomodoros = 0;
  let intervalId: number | null = null;

  const WORK_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  onMount(() => {
    loadState();

    const messageListener = (message: any) => {
      if (message.type === 'TIMER_UPDATE') {
        timeLeft = message.timeLeft;
        isRunning = message.isRunning;
        mode = message.mode;
        completedPomodoros = message.completedPomodoros;
        onTimerUpdate(timeLeft, isRunning, mode);
      }
    };

    if (typeof chromeApi !== 'undefined' && chromeApi.runtime) {
      chromeApi.runtime.onMessage.addListener(messageListener);

      return () => {
        chromeApi.runtime.onMessage.removeListener(messageListener);
      };
    }
  });

  async function loadState() {
    if (typeof chromeApi !== 'undefined' && chromeApi.storage) {
      const result = await chromeApi.storage.local.get(['timerState']);
      if (result.timerState) {
        const state = result.timerState;
        timeLeft = state.timeLeft;
        isRunning = state.isRunning;
        mode = state.mode;
        completedPomodoros = state.completedPomodoros;
        onTimerUpdate(timeLeft, isRunning, mode);
      }
    }
  }

  async function saveState() {
    if (typeof chromeApi !== 'undefined' && chromeApi.storage) {
      await chromeApi.storage.local.set({
        timerState: {
          timeLeft,
          isRunning,
          mode,
          completedPomodoros
        }
      });
    }
  }

  async function sendMessage(type: string, data: any = {}) {
    if (typeof chromeApi !== 'undefined' && chromeApi.runtime) {
      try {
        await chromeApi.runtime.sendMessage({ type, ...data });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  async function toggleTimer() {
    isRunning = !isRunning;
    await sendMessage('TOGGLE_TIMER');
    await saveState();
    onTimerUpdate(timeLeft, isRunning, mode);
  }

  async function resetTimer() {
    isRunning = false;
    timeLeft = mode === 'work' ? WORK_TIME : BREAK_TIME;
    await sendMessage('RESET_TIMER', { mode });
    await saveState();
    onTimerUpdate(timeLeft, isRunning, mode);
  }

  async function switchMode(newMode: 'work' | 'break') {
    mode = newMode;
    isRunning = false;
    timeLeft = mode === 'work' ? WORK_TIME : BREAK_TIME;
    await sendMessage('SWITCH_MODE', { mode });
    await saveState();
    onTimerUpdate(timeLeft, isRunning, mode);
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getMinutes(seconds: number): number {
    return Math.ceil(seconds / 60);
  }
</script>

<div class="pomodoro-timer" class:work-mode={mode === 'work'} class:break-mode={mode === 'break'}>
  <div class="timer-display">
    <div class="mode-indicator">
      {mode === 'work' ? '🍅 作業時間' : '☕ 休憩時間'}
    </div>
    <div class="time-display">
      {formatTime(timeLeft)}
    </div>
    <div class="pomodoro-count">
      今日の完了数: {completedPomodoros}
    </div>
  </div>

  <div class="controls">
    <button class="primary-button" on:click={toggleTimer}>
      {isRunning ? '⏸️ 一時停止' : '▶️ 開始'}
    </button>
    <button class="secondary-button" on:click={resetTimer}>
      🔄 リセット
    </button>
  </div>

  <div class="mode-switch">
    <button
      class="mode-button"
      class:active={mode === 'work'}
      on:click={() => switchMode('work')}
    >
      🍅 作業に切替
    </button>
    <button
      class="mode-button"
      class:active={mode === 'break'}
      on:click={() => switchMode('break')}
    >
      ☕ 休憩に切替
    </button>
  </div>
</div>

<style>
  .pomodoro-timer {
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
    min-width: 300px;
  }

  .work-mode {
    background: linear-gradient(135deg, #ffebee, #ffcdd2);
    border: 2px solid #f44336;
  }

  .break-mode {
    background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
    border: 2px solid #4caf50;
  }

  .timer-display {
    margin-bottom: 20px;
  }

  .mode-indicator {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .work-mode .mode-indicator {
    color: #c62828;
  }

  .break-mode .mode-indicator {
    color: #2e7d32;
  }

  .time-display {
    font-size: 48px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    margin: 15px 0;
  }

  .work-mode .time-display {
    color: #d32f2f;
  }

  .break-mode .time-display {
    color: #388e3c;
  }

  .pomodoro-count {
    font-size: 14px;
    opacity: 0.8;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;
  }

  .primary-button {
    background: #2196f3;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .primary-button:hover {
    background: #1976d2;
  }

  .secondary-button {
    background: #757575;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .secondary-button:hover {
    background: #616161;
  }

  .mode-switch {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .mode-button {
    padding: 8px 16px;
    border: 2px solid transparent;
    border-radius: 6px;
    background: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.7;
  }

  .mode-button:hover {
    opacity: 1;
  }

  .work-mode .mode-button.active {
    border-color: #f44336;
    background: #ffebee;
    opacity: 1;
  }

  .break-mode .mode-button.active {
    border-color: #4caf50;
    background: #e8f5e8;
    opacity: 1;
  }
</style>
