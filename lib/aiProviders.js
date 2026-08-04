'use strict';
// Compatibility facade. The current launch is OpenAI-only and all external AI
// requests are owned by the central registered-tool gateway.
const gateway=require('./centralAiGateway');
module.exports={configuredProviders:gateway.configuredProviders,generateMatterReview:gateway.generateMatterReview,buildFallbackAiReview:gateway.buildFallbackAiReview};
