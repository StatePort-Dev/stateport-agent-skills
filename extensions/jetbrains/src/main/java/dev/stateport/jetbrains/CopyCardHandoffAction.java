package dev.stateport.jetbrains;

import com.intellij.openapi.actionSystem.ActionUpdateThread;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.ide.CopyPasteManager;
import com.intellij.openapi.ui.Messages;
import org.jetbrains.annotations.NotNull;

import java.awt.datatransfer.StringSelection;

public final class CopyCardHandoffAction extends AnAction {
    @Override
    public @NotNull ActionUpdateThread getActionUpdateThread() {
        return ActionUpdateThread.EDT;
    }

    @Override
    public void actionPerformed(@NotNull AnActionEvent event) {
        String card = Messages.showInputDialog(event.getProject(), "Exact StatePort Card ID", "StatePort Card", null);
        if (card == null) return;
        String revision = Messages.showInputDialog(event.getProject(), "Exact StatePort Card revision", "StatePort Card", null);
        if (revision == null) return;
        try {
            CopyPasteManager.getInstance().setContents(new StringSelection(Handoff.create(card, revision)));
            Messages.showInfoMessage(event.getProject(),
                    "Exact Card handoff copied. Review and paste it into your agent. This command did not inspect the Card.",
                    "StatePort Card");
        } catch (IllegalArgumentException error) {
            Messages.showErrorDialog(event.getProject(), error.getMessage(), "StatePort Card");
        }
    }
}
