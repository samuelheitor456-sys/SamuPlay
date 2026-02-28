const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', () => {
  console.log('🔥 SamuPlay está online!');
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'play') {

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("Entre em um canal de voz!");

    const query = args.join(" ");
    if (!query) return message.reply("Coloque o nome ou link da música!");

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false,   // 👈 NÃO entra surdo
      selfMute: false    // 👈 NÃO entra mutado
    });

    // Espera conectar corretamente
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

    const player = createAudioPlayer();
    connection.subscribe(player);

    let stream;
    let songName;

    if (play.yt_validate(query) === "video") {
      stream = await play.stream(query);
      const info = await play.video_info(query);
      songName = info.video_details.title;
    } 
    else if (play.sp_validate(query) === "track") {
      const spotifyData = await play.spotify(query);
      const search = `${spotifyData.name} ${spotifyData.artists[0].name}`;
      const result = await play.search(search, { limit: 1 });
      stream = await play.stream(result[0].url);
      songName = result[0].title;
    }
    else {
      const result = await play.search(query, { limit: 1 });
      stream = await play.stream(result[0].url);
      songName = result[0].title;
    }

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    player.play(resource);

    message.reply(`🎵 Tocando: ${songName}`);
  }
});

client.login(process.env.TOKEN);
