interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  completedPomodoros: number;
  lastUpdate: number;
}

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

let timerState: TimerState = {
  timeLeft: WORK_TIME,
  isRunning: false,
  mode: 'work',
  completedPomodoros: 0,
  lastUpdate: Date.now(),
};

let timerInterval: ReturnType<typeof setInterval> | null = null;

export default defineBackground(() => {
  console.log('Pomodoro Timer background script started', {
    id: browser.runtime.id,
  });

  loadTimerState();

  browser.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
      switch (message.type) {
        case 'TOGGLE_TIMER':
          await toggleTimer();
          break;
        case 'RESET_TIMER':
          await resetTimer(message.mode);
          break;
        case 'SWITCH_MODE':
          await switchMode(message.mode);
          break;
        case 'GET_TIMER_STATE':
          sendResponse(timerState);
          break;
      }
    },
  );

  browser.runtime.onStartup.addListener(loadTimerState);
  browser.runtime.onInstalled.addListener(loadTimerState);

  startTimerLoop();
});

async function loadTimerState() {
  try {
    const result = await browser.storage.local.get(['timerState']);
    if (result.timerState) {
      const savedState = result.timerState as TimerState;

      if (savedState.isRunning) {
        const elapsed = Math.floor((Date.now() - savedState.lastUpdate) / 1000);
        savedState.timeLeft = Math.max(0, savedState.timeLeft - elapsed);

        if (savedState.timeLeft <= 0) {
          await handleTimerComplete(savedState);
        }
      }

      timerState = savedState;
      await updateBadge();
      await broadcastTimerUpdate();
    }
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
}

async function saveTimerState() {
  try {
    timerState.lastUpdate = Date.now();
    await browser.storage.local.set({ timerState });
  } catch (error) {
    console.error('Error saving timer state:', error);
  }
}

async function toggleTimer() {
  timerState.isRunning = !timerState.isRunning;
  await saveTimerState();
  await updateBadge();
  await broadcastTimerUpdate();
}

async function resetTimer(mode?: 'work' | 'break') {
  timerState.isRunning = false;
  timerState.timeLeft =
    (mode || timerState.mode) === 'work' ? WORK_TIME : BREAK_TIME;
  if (mode) {
    timerState.mode = mode;
  }
  await saveTimerState();
  await updateBadge();
  await broadcastTimerUpdate();
}

async function switchMode(mode: 'work' | 'break') {
  timerState.mode = mode;
  timerState.isRunning = false;
  timerState.timeLeft = mode === 'work' ? WORK_TIME : BREAK_TIME;
  await saveTimerState();
  await updateBadge();
  await broadcastTimerUpdate();
}

async function handleTimerComplete(state: TimerState) {
  const wasWorkTime = state.mode === 'work';

  if (wasWorkTime) {
    state.completedPomodoros++;
  }

  state.isRunning = false;
  state.timeLeft = 0;

  await showNotification(wasWorkTime);
  await saveTimerState();
  await updateBadge();
  await broadcastTimerUpdate();
}

async function showNotification(wasWorkTime: boolean) {
  const title = wasWorkTime ? '作業時間完了！' : '休憩時間完了！';
  const message = wasWorkTime
    ? 'お疲れさまでした！5分間の休憩を取りましょう。'
    : '休憩終了！次のポモドーロを始めましょう。';

  try {
    await browser.notifications.create({
      type: 'basic',
      iconUrl: '/icon/48.png',
      title,
      message,
      priority: 2,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

async function updateBadge() {
  try {
    const minutes = Math.ceil(timerState.timeLeft / 60);
    const badgeText = minutes > 0 ? minutes.toString() : '';

    await browser.action.setBadgeText({ text: badgeText });

    const color = timerState.mode === 'work' ? '#f44336' : '#4caf50';
    await browser.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

async function broadcastTimerUpdate() {
  try {
    browser.runtime.sendMessage({
      type: 'TIMER_UPDATE',
      timeLeft: timerState.timeLeft,
      isRunning: timerState.isRunning,
      mode: timerState.mode,
      completedPomodoros: timerState.completedPomodoros,
    });
  } catch (error) {}
}

function startTimerLoop() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(async () => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      timerState.timeLeft--;

      if (timerState.timeLeft <= 0) {
        await handleTimerComplete(timerState);
      } else {
        await updateBadge();
        await broadcastTimerUpdate();

        if (timerState.timeLeft % 30 === 0) {
          await saveTimerState();
        }
      }
    }
  }, 1000);
}
