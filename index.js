require("libsodium-wrappers");

const { 
  Client, 
  GatewayIntentBits 
} = require("discord.js");

const { 
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const play = require("play-dl");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = "!";

client.once("ready", () => {
  console.log(`✅ Online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "play") {

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Entre em um canal de voz.");

    const query = args.join(" ");
    if (!query) return message.reply("❌ Digite o nome ou link.");

    try {

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 20000);

      let stream;

      if (play.yt_validate(query) === "video") {
        stream = await play.stream(query);
      } else {
        const result = await play.search(query, { limit: 1 });
        if (!result.length) return message.reply("❌ Música não encontrada.");
        stream = await play.stream(result[0].url);
      }

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("🎵 Tocando!");
      });

      player.on("error", error => {
        console.error("Erro no player:", error);
      });

      message.reply("🎵 Tocando agora!");

    } catch (err) {
      console.error("ERRO REAL:", err);
      message.reply("❌ Erro ao tocar música.");
    }
  }
});

client.login(process.env.TOKEN);
