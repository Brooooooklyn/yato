import Bucket, {BucketCategory} from './Bucket'
import Metrics from './Metrics'

export interface BucketListOptions {
  windowDuration: number,
  numBuckets: number
}

export {BucketCategory}

export default class BucketList {
  private _buckets: Array<Bucket> = [new Bucket()]
  constructor(options: BucketListOptions, private _onNewRuntimeCollected: () => void) {
    if (options.numBuckets <= 0) {
      throw new Error(`Expect "numBuckets" to be positive, got ${options.numBuckets}`)
    }

    const bucketDuration = options.windowDuration / options.numBuckets
    setInterval(() => {
      this._buckets.push(new Bucket())

      if (this._buckets.length > options.numBuckets) {
        this._buckets.shift()
      }
    }, bucketDuration)
  }

  get currentBucket(): Bucket {
    return this._buckets[this._buckets.length - 1]
  }

  get latestResponseTime(): number {
    const {runTimes} = this.currentBucket
    return runTimes.length === 0 ? 0 : runTimes[runTimes.length - 1]
  }

  increaseBucketValue(category: BucketCategory) {
    const bucket = this.currentBucket
    switch (category) {
      case BucketCategory.Failures: bucket.failures += 1; break;
      case BucketCategory.ShortCircuits: bucket.shortCircuits += 1; break;
      case BucketCategory.Successes: bucket.successes += 1; break;
      case BucketCategory.Timeouts: bucket.timeouts += 1; break;
    }
  }

  collectRuntime (runtime: number) {
    this.currentBucket.runTimes.push(runtime)
    this._onNewRuntimeCollected()
  }

  getMetrics(): Metrics {
    return this._buckets.reduce((metrics, bucket) => metrics.involve(bucket), new Metrics())
  }

  getSortedRuntimes(): Array<number> {
    return this._buckets
      .reduce((logs: Array<number>, bucket) => logs.concat(bucket.runTimes), [])
      .sort((x, y) => x - y)
  }
}