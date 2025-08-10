<script lang="ts">
  import { onMount } from 'svelte';
  import { WORK_TIME, BREAK_TIME, type TimerState } from './timer-types';

  const chromeApi = (globalThis as any).chrome;

  export let onTimerUpdate: (timeLeft: number, isRunning: boolean, mode: 'work' | 'break') => void = () => {};

  let timeLeft = WORK_TIME;
  let isRunning = false;
  let mode: 'work' | 'break' = 'work';
  let completedPomodoros = 0;
  let isInitialized = false;

  function updateState(state: Partial<TimerState>) {
    if (state.timeLeft !== undefined) timeLeft = state.timeLeft;
    if (state.isRunning !== undefined) isRunning = state.isRunning;
    if (state.mode !== undefined) mode = state.mode;
    if (state.completedPomodoros !== undefined) completedPomodoros = state.completedPomodoros;
    isInitialized = true;
    onTimerUpdate(timeLeft, isRunning, mode);
  }

  async function initializeFromBackground() {
    if (typeof chromeApi !== 'undefined' && chromeApi.runtime) {
      try {
        const response = await chromeApi.runtime.sendMessage({ type: 'GET_TIMER_STATE' });
        if (response) {
          updateState(response);
          return true;
        }
      } catch (error) {
        console.log('Background script not available');
      }
    }
    return false;
  }

  onMount(() => {
    async function initialize() {
      // backgroundスクリプトから状態を取得を試行
      const initialized = await initializeFromBackground();

      // 失敗した場合のみデフォルト値で初期化
      if (!initialized) {
        updateState({});
      }
    }

    initialize();

    // メッセージリスナーを設定
    const messageListener = (message: any) => {
      if (message.type === 'TIMER_UPDATE') {
        updateState(message);
      }
    };

    if (typeof chromeApi !== 'undefined' && chromeApi.runtime) {
      chromeApi.runtime.onMessage.addListener(messageListener);
      return () => {
        chromeApi.runtime.onMessage.removeListener(messageListener);
      };
    }
  });


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
    await sendMessage('TOGGLE_TIMER');
  }

  async function resetTimer() {
    await sendMessage('RESET_TIMER', { mode });
  }

  async function switchMode(newMode: 'work' | 'break') {
    await sendMessage('SWITCH_MODE', { mode: newMode });
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
  {#if isInitialized}
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
  {:else}
    <div class="timer-display">
      <div class="loading">読み込み中...</div>
    </div>
  {/if}

  {#if isInitialized}
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
  {/if}
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
    border: 1px solid #94a3b8;
  }

  .break-mode {
    border: 1px solid #94a3b8;
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
    color: #64748b;
  }

  .break-mode .mode-indicator {
    color: #64748b;
  }

  .time-display {
    font-size: 48px;
    font-weight: bold;
    font-family: 'UDEV Gothic', 'HackGen', 'Courier New', monospace;
    margin: 15px 0;
  }

  .work-mode .time-display {
    color: #374151;
  }

  .break-mode .time-display {
    color: #374151;
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
    border-color: #94a3b8;
    opacity: 1;
  }

  .break-mode .mode-button.active {
    border-color: #94a3b8;
    opacity: 1;
  }

  .loading {
    font-size: 16px;
    color: #666;
    padding: 48px 0;
  }
</style>
