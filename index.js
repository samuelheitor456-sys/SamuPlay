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
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "play") {

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply("❌ Você precisa estar em um canal de voz!");
    }

    const query = args.join(" ");
    if (!query) {
      return message.reply("❌ Digite o nome da música ou link!");
    }

    try {

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      let stream;

      if (play.yt_validate(query) === "video") {
        stream = await play.stream(query);
      } else {
        const search = await play.search(query, { limit: 1 });
        if (!search.length) {
          return message.reply("❌ Música não encontrada!");
        }
        stream = await play.stream(search[0].url);
      }

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      connection.subscribe(player);
      player.play(resource);

      message.reply("🎵 Tocando agora!");

    } catch (error) {
      console.error(error);
      message.reply("❌ Erro ao tocar música.");
    }
  }

  if (command === "stop") {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply("❌ Você precisa estar em um canal de voz!");
    }
    voiceChannel.leave();
  }

});

client.login(process.env.TOKEN);
