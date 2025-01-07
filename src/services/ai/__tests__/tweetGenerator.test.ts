import { TweetGenerator } from '../tweetGenerator.js';
import { CONFIG } from '../../../config/settings.js';

describe('TweetGenerator', () => {
  let generator: TweetGenerator;

  beforeEach(() => {
    generator = new TweetGenerator();
  });

  describe('generateTweetContent', () => {
    it('should generate tweet content with market data', async () => {
      const context = {
        marketData: {
          price: 1.23,
          volume24h: 1000000,
          marketCap: 10000000,
          priceChange24h: 5.5,
          topHolders: []
        },
        style: {
          tone: 'bullish' as const,
          humor: 0.7,
          formality: 0.5
        }
      };

      const tweet = await generator.generateTweetContent(context);
      expect(tweet).toBeDefined();
      expect(tweet.content.length).toBeLessThanOrEqual(280);
    });

    it('should not contain emojis or hashtags in generated content', async () => {
      const context = {
        marketData: {
          price: 1.23,
          volume24h: 1000000,
          marketCap: 10000000,
          priceChange24h: 5.5,
          topHolders: [],
          onChainData: {
            recentSwaps: 15,
            recentTransfers: 25,
            totalTransactions: 40
          }
        },
        style: {
          tone: 'neutral' as const,
          humor: 0,
          formality: 0.8
        },
        constraints: {
          maxLength: 280,
          includeTickers: true,
          includeMetrics: true
        }
      };

      const tweet = await generator.generateTweetContent(context);
      expect(tweet).toBeDefined();
      expect(tweet.content).not.toMatch(/[#️⃣#⃣#]/); // No hashtags
      expect(tweet.content).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u); // No emojis
      expect(tweet.content).not.toMatch(/[$MEME]/); // No cashtags
    });

    it('should generate tweet content without market data', async () => {
      const context = {
        trendingTopics: ['#crypto', '#solana'],
        style: {
          tone: 'neutral' as const,
          humor: 0.5,
          formality: 0.5
        }
      };

      const tweet = await generator.generateTweetContent(context);
      expect(tweet).toBeDefined();
      expect(tweet.content.length).toBeLessThanOrEqual(280);
    });
  });

  describe('generateThreadFromMarketUpdate', () => {
    it('should generate a thread of tweets', async () => {
      const marketData = {
        price: 1.23,
        volume24h: 1000000,
        marketCap: 10000000,
        priceChange24h: 5.5,
        topHolders: []
      };

      const thread = await generator.generateThreadFromMarketUpdate(marketData);
      expect(thread).toBeDefined();
      expect(thread.length).toBeGreaterThan(0);
      thread.forEach(tweet => {
        expect(tweet.length).toBeLessThanOrEqual(280);
      });
    });
  });
});
