import express from "express";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get AI campaign recommendations for the current volunteer
// @route   GET /ai/recommendations
// @access  Private (Volunteer only)
router.get("/recommendations", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const volunteer = req.user;
        const campaigns = await Campaign.find({ status: "Upcoming" });

        if (campaigns.length === 0) {
            return res.status(200).json({ success: true, recommendations: [] });
        }

        const isGroqConfigured =
            process.env.GROQ_API_KEY &&
            !process.env.GROQ_API_KEY.includes("replace_this");

        let recommendations = [];

        if (isGroqConfigured) {
            try {
                // Initialize LangChain ChatGroq model
                const model = new ChatGroq({
                    apiKey: process.env.GROQ_API_KEY,
                    model: "llama-3.1-8b-instant", // Fast and efficient model
                    temperature: 0.1
                });

                // Prepare context for the prompt
                const volunteerProfile = {
                    name: volunteer.name,
                    skills: volunteer.skills,
                    interests: volunteer.interests,
                    location: volunteer.location,
                    availability: volunteer.availability
                };

                const campaignsContext = campaigns.map(c => ({
                    id: c._id.toString(),
                    title: c.title,
                    description: c.description,
                    category: c.category,
                    skillsRequired: c.skillsRequired,
                    location: c.location
                }));

                const systemMsg = new SystemMessage(
                    "You are an expert AI Campaign Matcher for a community service portal. Your task is to calculate a compatibility match score (0-100%) between a volunteer's profile and active campaigns. Respond ONLY with a valid JSON array of objects. Do not include markdown code blocks or explanations outside of the JSON. Format: [ { \"campaignId\": \"string\", \"score\": number, \"reason\": \"string\" } ]"
                );

                const prompt = `
Volunteer Profile:
${JSON.stringify(volunteerProfile, null, 2)}

Active Campaigns:
${JSON.stringify(campaignsContext, null, 2)}

Calculate matching scores. For each campaign, return:
1. campaignId: exact id string of the campaign.
2. score: an integer score between 0 and 100 based on skill overlap, interest category matching, location proximity, and availability compatibility.
3. reason: a brief 1-sentence explanation detailing why this volunteer fits.
`;

                const response = await model.invoke([systemMsg, new HumanMessage(prompt)]);
                let contentText = response.content.trim();

                // Clean markdown wrappers if returned by the LLM
                if (contentText.startsWith("```json")) {
                    contentText = contentText.substring(7, contentText.length - 3).trim();
                } else if (contentText.startsWith("```")) {
                    contentText = contentText.substring(3, contentText.length - 3).trim();
                }

                recommendations = JSON.parse(contentText);
            } catch (aiError) {
                console.error("LangChain Groq Error, falling back to algorithmic match:", aiError);
                recommendations = generateFallbackRecommendations(volunteer, campaigns);
            }
        } else {
            // Use algorithmic fallback if Groq API key is not configured
            recommendations = generateFallbackRecommendations(volunteer, campaigns);
        }

        // Attach campaign details to recommendations
        const richRecommendations = recommendations.map(rec => {
            const campaignDetails = campaigns.find(c => c._id.toString() === rec.campaignId);
            return {
                ...rec,
                campaign: campaignDetails
            };
        }).filter(rec => rec.campaign !== undefined);

        // Sort by score descending
        richRecommendations.sort((a, b) => b.score - a.score);

        res.status(200).json({
            success: true,
            isAiGenerated: isGroqConfigured,
            recommendations: richRecommendations
        });
    } catch (error) {
        console.error("AI Recommendations General Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Local heuristic matcher when Groq is not configured or fails.
 */
function generateFallbackRecommendations(volunteer, campaigns) {
    return campaigns.map(c => {
        let score = 50; // Base score
        let reasons = [];

        // 1. Category check
        const categoryMap = {
            "Healthcare": ["health", "medical", "doctor", "nurse", "blood", "care"],
            "Environmental": ["tree", "nature", "cleanup", "beach", "eco", "plants"],
            "Education": ["teach", "tutoring", "kids", "tech", "books", "literacy"],
            "Food Security": ["food", "distribution", "bank", "kitchen", "hungry"],
            "Social Services": ["elderly", "senior", "shelter", "community"]
        };

        const interestKeywords = volunteer.interests.map(i => i.toLowerCase());
        const categoryKeywords = categoryMap[c.category] || [];
        const hasInterestMatch = interestKeywords.some(interest =>
            interest.includes(c.category.toLowerCase()) ||
            categoryKeywords.some(kw => interest.includes(kw))
        );

        if (hasInterestMatch) {
            score += 20;
            reasons.push(`matches your interest in ${c.category}`);
        }

        // 2. Skills overlap
        const required = c.skillsRequired.map(s => s.toLowerCase());
        const possessed = volunteer.skills.map(s => s.toLowerCase());
        const matchingSkills = required.filter(s => possessed.some(p => p.includes(s) || s.includes(p)));

        if (matchingSkills.length > 0) {
            score += matchingSkills.length * 10;
            reasons.push(`utilizes your skills in ${matchingSkills.join(", ")}`);
        }

        // 3. Location check
        if (volunteer.location && c.location && volunteer.location.toLowerCase() === c.location.toLowerCase()) {
            score += 10;
            reasons.push("is in your local area");
        }

        // Cap at 98
        score = Math.min(score, 98);

        // Standard reason
        let finalReason = `Baseline recommendation based on campaign categories.`;
        if (reasons.length > 0) {
            finalReason = `Matches because the event ${reasons.join(" and ")}.`;
        }

        return {
            campaignId: c._id.toString(),
            score,
            reason: finalReason
        };
    });
}

// @desc    Converse with the AI Matching Assistant
// @route   POST /ai/chat
// @access  Private (Volunteer only)
router.post("/chat", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: "Please provide a chat message" });
        }

        const volunteer = req.user;
        const campaigns = await Campaign.find({ status: "Upcoming" });

        const isGroqConfigured =
            process.env.GROQ_API_KEY &&
            !process.env.GROQ_API_KEY.includes("replace_this");

        const volunteerProfile = {
            name: volunteer.name,
            skills: volunteer.skills,
            interests: volunteer.interests,
            location: volunteer.location,
            availability: volunteer.availability
        };

        const campaignsContext = campaigns.map(c => ({
            title: c.title,
            category: c.category,
            skillsRequired: c.skillsRequired,
            location: c.location
        }));

        if (isGroqConfigured) {
            try {
                const model = new ChatGroq({
                    apiKey: process.env.GROQ_API_KEY,
                    model: "llama-3.1-8b-instant",
                    temperature: 0.7
                });

                const systemMsg = new SystemMessage(
                    `You are the Unity AI Matching Assistant for a community volunteer portal. You help volunteers find campaigns, explain how matches work, answer profile questions (such as their name, skills, interests), and direct them to join campaigns.
                    Volunteer Profile: ${JSON.stringify(volunteerProfile)}
                    Active Campaigns: ${JSON.stringify(campaignsContext)}
                    Answer the user's message politely, referencing their profile details if relevant (like their name). Keep the answer concise and friendly (under 4 sentences).`
                );

                const response = await model.invoke([systemMsg, new HumanMessage(message)]);
                return res.status(200).json({
                    success: true,
                    isAiGenerated: true,
                    response: response.content.trim()
                });
            } catch (aiError) {
                console.error("LangChain Chat Error, falling back:", aiError);
            }
        }

        // Local Heuristic Conversational Fallback
        const lowerMsg = message.toLowerCase();
        let responseText = `Hello ${volunteer.name}! I am currently running in offline assistant mode. `;

        if (lowerMsg.includes("name") || lowerMsg.includes("who am i")) {
            responseText += `Your profile name in our database is "${volunteer.name}".`;
        } else if (lowerMsg.includes("skill") || lowerMsg.includes("what can i do")) {
            responseText += `You have registered these skills: ${volunteer.skills.join(", ") || "none specified yet"}. You can update these in your dashboard profile!`;
        } else if (lowerMsg.includes("interest") || lowerMsg.includes("like")) {
            responseText += `Your registered interests are: ${volunteer.interests.join(", ") || "none specified yet"}.`;
        } else if (lowerMsg.includes("campaign") || lowerMsg.includes("recommend") || lowerMsg.includes("match")) {
            if (campaigns.length > 0) {
                responseText += `I analyzed ${campaigns.length} upcoming campaign(s) for you. Check out the "Match Recommendations" panel on the right of the screen for your exact compatibility scores!`;
            } else {
                responseText += `There are currently no upcoming campaigns in our database. Once the Admin registers new campaigns, I will analyze them for you.`;
            }
        } else {
            responseText += `You asked: "${message}". In offline mode, I can tell you about your name, skills, interests, or campaigns. Try asking "what are my skills?" or "what campaigns do you recommend?"`;
        }

        return res.status(200).json({
            success: true,
            isAiGenerated: false,
            response: responseText
        });
    } catch (error) {
        console.error("AI Chat Route Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
