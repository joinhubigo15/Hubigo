export class ProgressReporter {
  private uploaded = 0;
  private skipped = 0;
  private failed = 0;
  private bytesUploaded = 0;
  private readonly startedAt = Date.now();
  private lastRenderAt = 0;
  private readonly milestoneEvery: number;
  private nextMilestoneAt: number;

  constructor(
    private readonly total: number,
    private readonly label: string = "",
  ) {
    // Whichever is more frequent: every 5% or every 2500 files.
    this.milestoneEvery = Math.max(1, Math.min(2500, Math.ceil(total * 0.05)));
    this.nextMilestoneAt = this.milestoneEvery;
  }

  recordUploaded(bytes: number) {
    this.uploaded++;
    this.bytesUploaded += bytes;
    this.render();
  }

  recordSkipped() {
    this.skipped++;
    this.render();
  }

  recordFailed() {
    this.failed++;
    this.render();
  }

  private render(force = false) {
    const now = Date.now();
    const done = this.uploaded + this.skipped + this.failed;

    if (done >= this.nextMilestoneAt || done === this.total) {
      this.logMilestone(done);
      while (this.nextMilestoneAt <= done) this.nextMilestoneAt += this.milestoneEvery;
    }

    if (!force && now - this.lastRenderAt < 200) return; // throttle terminal writes
    this.lastRenderAt = now;
    process.stdout.write(`\r${this.statusLine(done)}`.padEnd(140));
  }

  private statusLine(done: number): string {
    const elapsedSec = (Date.now() - this.startedAt) / 1000;
    const speedFilesPerSec = elapsedSec > 0 ? done / elapsedSec : 0;
    const speedMBPerSec = elapsedSec > 0 ? this.bytesUploaded / 1024 / 1024 / elapsedSec : 0;
    const remaining = this.total - done;
    const etaSec = speedFilesPerSec > 0 ? remaining / speedFilesPerSec : Infinity;
    const pct = this.total > 0 ? ((done / this.total) * 100).toFixed(1) : "100.0";

    return (
      `${this.label}[${done}/${this.total} ${pct}%] uploaded=${this.uploaded} skipped=${this.skipped} failed=${this.failed} ` +
      `| ${speedFilesPerSec.toFixed(1)} files/s, ${speedMBPerSec.toFixed(2)} MB/s | ETA ${formatDuration(etaSec)}`
    );
  }

  private logMilestone(done: number) {
    process.stdout.write("\n");
    console.log(`MILESTONE ${this.statusLine(done)}`);
  }

  finish() {
    this.render(true);
    process.stdout.write("\n");
  }

  get summary() {
    return { uploaded: this.uploaded, skipped: this.skipped, failed: this.failed, bytesUploaded: this.bytesUploaded };
  }
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${sec}s`;
  return `${sec}s`;
}
