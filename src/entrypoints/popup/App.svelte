<script lang="ts">
  import PomodoroTimer from '../../lib/PomodoroTimer.svelte'

  let badgeTimeLeft = 0;
  let badgeIsRunning = false;
  let badgeMode: 'work' | 'break' = 'work';

  function handleTimerUpdate(timeLeft: number, isRunning: boolean, mode: 'work' | 'break') {
    badgeTimeLeft = timeLeft;
    badgeIsRunning = isRunning;
    badgeMode = mode;
  }
</script>

<main>
  <div class="app-header">
    <h1>🍅 ポモドーロタイマー</h1>
  </div>

  <PomodoroTimer onTimerUpdate={handleTimerUpdate} />
</main>

<style>
  main {
    padding: 0;
    margin: 0;
    background: #f5f5f5;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    text-align: center;
    margin-bottom: 0;
  }

  .app-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: bold;
  }
</style>
