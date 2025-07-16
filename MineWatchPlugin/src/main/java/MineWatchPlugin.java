import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import javax.websocket.ClientEndpoint;
import javax.websocket.OnClose;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import java.net.URI;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

@ClientEndpoint
public class MineWatchPlugin extends JavaPlugin implements Listener {
    private Session wsSession;
    private final Set<String> usedCameraIds = new HashSet<>();

    @Override
    public void onEnable() {
        getServer().getPluginManager().registerEvents(this, this);
        connectWebSocket();
        // Start hypothetical RTMP streaming (requires external setup, e.g., OBS)
    }

    private String generateRandomCameraId() {
        Random random = new Random();
        String newId;
        do {
            newId = String.format("%04d", random.nextInt(9000) + 1000);
        } while (usedCameraIds.contains(newId));
        usedCameraIds.add(newId);
        return newId;
    }

    private void connectWebSocket() {
        try {
            new javax.websocket.WebSocketContainer().connectToServer(this, new URI("ws://minewatch-reborn.onrender.com:8080"));
        } catch (Exception e) {
            getLogger().severe("WebSocket connection failed: " + e.getMessage());
            // Retry connection after 5 seconds
            new BukkitRunnable() {
                @Override
                public void run() {
                    connectWebSocket();
                }
            }.runTaskLater(this, 100);
        }
    }

    @OnOpen
    public void onOpen(Session session) {
        this.wsSession = session;
        getLogger().info("Connected to WebSocket server");
    }

    @OnClose
    public void onClose() {
        this.wsSession = null;
        new BukkitRunnable() {
            @Override
            public void run() {
                connectWebSocket();
            }
        }.runTaskLater(this, 100);
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        // Check if snooper is enabled (hypothetical, as snooper status isn't directly accessible)
        String cameraId = generateRandomCameraId();
        String json = String.format("{\"event\":\"waiting\",\"snooperEnabled\":true,\"username\":\"%s\"}", player.getName());
        sendWebSocketMessage(json);
        // Notify player of camera ID
        player.sendRawMessage("{\"text\":\"Your camera ID is " + cameraId + "\",\"color\":\"green\"}");
        // Start RTMP stream (requires external setup, e.g., OBS)
        json = String.format("{\"event\":\"join\",\"cameraId\":\"%s\",\"username\":\"%s\",\"action\":\"Idle\"}", cameraId, player.getName());
        sendWebSocketMessage(json);
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        String cameraId = usedCameraIds.stream().filter(id -> playersContainId(id, player.getName())).findFirst().orElse(null);
        if (cameraId != null) {
            usedCameraIds.remove(cameraId);
            String json = String.format("{\"event\":\"leave\",\"cameraId\":\"%s\"}", cameraId);
            sendWebSocketMessage(json);
        }
    }

    private boolean playersContainId(String cameraId, String username) {
        // Simplified check (update with actual player-camera mapping if needed)
        return usedCameraIds.contains(cameraId);
    }

    private void sendWebSocketMessage(String message) {
        if (wsSession != null && wsSession.isOpen()) {
            try {
                wsSession.getBasicRemote().sendText(message);
            } catch (Exception e) {
                getLogger().severe("Failed to send WebSocket message: " + e.getMessage());
            }
        }
    }
}