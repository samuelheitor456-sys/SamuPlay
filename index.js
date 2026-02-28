const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    entersState,
    VoiceConnectionStatus
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const play = require('play-dl');
const { getData } = require('spotify-url-info')(fetch);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const queue = new Map();

client.once('ready', () => {
    console.log('🎵 SamuPlay está online!');
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play') {
        if (!message.member.voice.channel)
            return message.reply('Entre em uma call primeiro!');

        const url = args[0];
        if (!url) return message.reply('Envie um link do YouTube ou Spotify.');

        let songURL = url;

        // 🎵 Se for Spotify, converte pra busca no YouTube
        if (url.includes('spotify.com')) {
            const data = await getData(url);
            const search = `${data.name} ${data.artists.map(a => a.name).join(" ")}`;
            const results = await play.search(search, { limit: 1 });
            if (!results.length) return message.reply("Não encontrei no YouTube.");
            songURL = results[0].url;
        }

        playMusic(message, songURL);
    }

    if (command === 'stop') {
        const serverQueue = queue.get(message.guild.id);
        if (!serverQueue) return;

        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queue.delete(message.guild.id);
        message.reply("⏹ Música parada.");
    }

    if (command === 'skip') {
        const serverQueue = queue.get(message.guild.id);
        if (!serverQueue) return;

        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queue.delete(message.guild.id);
        message.reply("⏭ Saindo da call.");
    }

    if (command === 'pause') {
        const serverQueue = queue.get(message.guild.id);
        if (!serverQueue) return;

        serverQueue.player.pause();
        message.reply("⏸ Música pausada.");
    }

    if (command === 'resume') {
        const serverQueue = queue.get(message.guild.id);
        if (!serverQueue) return;

        serverQueue.player.unpause();
        message.reply("▶ Música retomada.");
    }
});

async function playMusic(message, url) {
  const voiceChannel = message.member.voice.channel;

  // Criar conexão
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  // Espera entrar no estado pronto
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch (error) {
    console.error(error);
    connection.destroy();
    return message.reply("❌ Não consegui conectar ao canal de voz.");
  }

  // Preparar stream
  const stream = ytdl(url, {
    filter: 'audioonly',
    highWaterMark: 1 << 25
  });

  const resource = createAudioResource(stream);

  const player = createAudioPlayer();

  // Assina para tocar
  connection.subscribe(player);

  player.play(resource);

  // Quando terminar, desconecta
  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });

  message.reply("🎶 Tocando agora!");
}
