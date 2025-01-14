// src/utils/viralUtils.ts
export class ViralUtils {
    aiService;
    VIRAL_THRESHOLD = 0.7;
    BOOST_PATTERNS = new Map([
        ['emotion', 0.2],
        ['urgency', 0.15],
        ['curiosity', 0.15],
        ['controversy', 0.1],
        ['trending', 0.2],
        ['social_proof', 0.2]
    ]);
    constructor(aiService) {
        this.aiService = aiService;
    }
    async calculateViralPotential(content, context) {
        try {
            const components = {
                timing: await this.calculateTimingScore(context.timeOfDay),
                content: await this.calculateContentScore(content),
                engagement: await this.calculateEngagementPotential(content, context),
                momentum: await this.calculateMomentumScore(context.recentTrends),
                audience: await this.calculateAudienceScore(context.audience)
            };
            const total = this.calculateTotalScore(components);
            const suggestions = await this.generateOptimizationSuggestions(content, components, total);
            return {
                total,
                components,
                metadata: {
                    timestamp: Date.now(),
                    confidence: this.calculateConfidence(components),
                    suggestions
                }
            };
        }
        catch (error) {
            console.error('Error calculating viral potential:', error);
            throw error;
        }
    }
    async optimizeContent(content, targetScore = 0.8) {
        try {
            const changes = [];
            let currentContent = content;
            let currentScore = await this.calculateContentScore(content);
            while (currentScore < targetScore) {
                const optimizations = await this.identifyOptimizations(currentContent, currentScore, targetScore);
                if (optimizations.length === 0)
                    break;
                // Apply the most impactful optimization
                const bestOptimization = optimizations[0];
                currentContent = await this.applyOptimization(currentContent, bestOptimization);
                changes.push(bestOptimization);
                currentScore = await this.calculateContentScore(currentContent);
            }
            return {
                originalContent: content,
                optimizedContent: currentContent,
                changes,
                predictedImpact: currentScore - (await this.calculateContentScore(content))
            };
        }
        catch (error) {
            console.error('Error optimizing content:', error);
            throw error;
        }
    }
    async calculateTimingScore(timeOfDay) {
        // Peak hours: 8-10 AM, 12-2 PM, 7-9 PM
        const peakHours = [
            [8, 10],
            [12, 14],
            [19, 21]
        ];
        const hour = new Date(timeOfDay).getHours();
        let score = 0;
        for (const [start, end] of peakHours) {
            if (hour >= start && hour <= end) {
                score = 1;
                break;
            }
            // Score decreases based on distance from peak hours
            const distanceToStart = Math.min(Math.abs(hour - start), Math.abs(hour - end));
            score = Math.max(score, 1 - distanceToStart * 0.1);
        }
        return score;
    }
    async calculateContentScore(content) {
        let score = 0;
        // Check for viral patterns
        for (const [pattern, weight] of this.BOOST_PATTERNS.entries()) {
            if (await this.containsPattern(content, pattern)) {
                score += weight;
            }
        }
        // Add sentiment impact
        const sentiment = await this.analyzeSentiment(content);
        score += Math.abs(sentiment) * 0.2;
        // Add readability impact
        const readability = this.calculateReadability(content);
        score += (1 - readability) * 0.1;
        return Math.min(1, score);
    }
    async containsPattern(content, pattern) {
        // Use AI to detect patterns
        const prompt = `
      Analyze if the following content contains ${pattern} pattern:
      "${content}"
      
      Response format: { "contains": boolean, "confidence": number }
      Type: pattern_analysis
    `;
        const response = await this.aiService.generateResponse({
            content: prompt,
            author: 'system',
            platform: 'default'
        });
        try {
            return JSON.parse(response).contains;
        }
        catch (error) {
            console.error('Error parsing pattern detection response:', error);
            return false;
        }
    }
    calculateReadability(content) {
        // Implement Flesch-Kincaid readability score
        const words = content.split(/\s+/).length;
        const sentences = content.split(/[.!?]+/).length;
        const syllables = this.countSyllables(content);
        const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
        return Math.max(0, Math.min(1, score / 100));
    }
    countSyllables(text) {
        // Simplified syllable counting
        return text
            .toLowerCase()
            .split(/\s+/)
            .reduce((count, word) => count + this.wordSyllables(word), 0);
    }
    wordSyllables(word) {
        const vowels = 'aeiouy';
        let count = 0;
        let previousChar = '';
        for (const char of word) {
            if (vowels.includes(char) && !vowels.includes(previousChar)) {
                count++;
            }
            previousChar = char;
        }
        if (word.endsWith('e'))
            count--;
        return Math.max(1, count);
    }
    async calculateEngagementPotential(content, context) {
        // Analyze potential engagement factors
        const factors = {
            callToAction: this.hasCallToAction(content),
            questionPrompt: content.includes('?'),
            mentionsUsers: content.includes('@'),
            hasHashtags: content.includes('#'),
            relevantToAudience: await this.checkAudienceRelevance(content, context.audience)
        };
        return Object.values(factors).reduce((sum, value) => sum + (value ? 0.2 : 0), 0);
    }
    hasCallToAction(content) {
        const ctaPatterns = [
            'like',
            'share',
            'follow',
            'retweet',
            'comment',
            'tell us',
            'what do you think'
        ];
        return ctaPatterns.some(pattern => content.toLowerCase().includes(pattern));
    }
    async checkAudienceRelevance(content, audience) {
        const prompt = `
      Analyze if this content is relevant to the following audience:
      Content: "${content}"
      Audience: ${audience.join(', ')}
      
      Response format: { "relevant": boolean, "confidence": number }
      Type: audience_analysis
    `;
        const response = await this.aiService.generateResponse({
            content: prompt,
            author: 'system',
            platform: 'default'
        });
        try {
            return JSON.parse(response).relevant;
        }
        catch (error) {
            console.error('Error parsing audience relevance response:', error);
            return false;
        }
    }
    async calculateMomentumScore(recentTrends) {
        if (!recentTrends.length)
            return 0;
        let score = 0;
        const weights = {
            veryCurrent: 0.4,
            recent: 0.3,
            ongoing: 0.2
        };
        // Group trends by recency
        const trendGroups = {
            veryCurrent: recentTrends.slice(0, 3),
            recent: recentTrends.slice(3, 7),
            ongoing: recentTrends.slice(7)
        };
        for (const [group, trends] of Object.entries(trendGroups)) {
            if (trends.length > 0) {
                score += weights[group];
            }
        }
        return score;
    }
    async calculateAudienceScore(audience) {
        // Implement audience reach and engagement potential calculation
        return 0.5;
    }
    calculateTotalScore(components) {
        const weights = {
            timing: 0.2,
            content: 0.3,
            engagement: 0.2,
            momentum: 0.15,
            audience: 0.15
        };
        return Object.entries(components).reduce((total, [component, score]) => total + score * weights[component], 0);
    }
    calculateConfidence(components) {
        const variance = this.calculateVariance(Object.values(components));
        return 1 - variance;
    }
    calculateVariance(numbers) {
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length);
    }
    async identifyOptimizations(content, currentScore, targetScore) {
        // Generate potential optimizations using AI
        return [];
    }
    async applyOptimization(content, optimization) {
        // Apply the optimization to the content
        return content;
    }
    async generateOptimizationSuggestions(content, components, total) {
        // Generate suggestions for optimizing content
        return [];
    }
    async analyzeSentiment(content) {
        // Analyze sentiment of the content
        return 0;
    }
}