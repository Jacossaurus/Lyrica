import mongoose from "mongoose";

const GuildSchema = new mongoose.Schema({
	guildId: Number,

	settings: {
		explicitLyrics: Boolean,
	},
});

export default mongoose.model("Guild", GuildSchema);
