package dev.stateport.jetbrains;

import com.intellij.openapi.actionSystem.ActionUpdateThread;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.ui.Messages;
import org.jetbrains.annotations.NotNull;

public final class ShowSetupAction extends AnAction {
    @Override
    public @NotNull ActionUpdateThread getActionUpdateThread() {
        return ActionUpdateThread.EDT;
    }

    @Override
    public void actionPerformed(@NotNull AnActionEvent event) {
        Messages.showInfoMessage(event.getProject(),
                "In installed StatePort Desktop, use Copy MCP config and review its command and arguments.\n"
                + "In the IDE, open Settings | Tools | AI Assistant | Model Context Protocol (MCP), add that JSON "
                + "as a local STDIO server, and inspect the connection status and available tools.\n"
                + "AI Assistant is the MCP client; the IDE's own MCP server is a different direction. "
                + "No connection has been configured or checked by this plugin.",
                "Connect StatePort to AI Assistant");
    }
}
