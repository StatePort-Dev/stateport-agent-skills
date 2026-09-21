package dev.stateport.jetbrains;

public final class Handoff {
    private Handoff() {}

    public static String create(String card, String revision) {
        if (!exactIdentifier(card) || !exactIdentifier(revision)) {
            throw new IllegalArgumentException("Use exact Card and revision identifiers with letters, digits, . _ : / @ # - only.");
        }
        return "Use StatePort Card `" + card + "` at exact revision `" + revision + "`. "
                + "Inspect that Card first, open it on the current code, then reopen the same Card/revision "
                + "and compare evidence after the change. Do not start a new Capture for this supplied Card. "
                + "Confirm the identity and results through the public StatePort MCP tools.";
    }

    private static boolean exactIdentifier(String value) {
        return value != null && value.length() > 0 && value.length() <= 256
                && value.matches("[A-Za-z0-9][A-Za-z0-9._:/@#-]*")
                && !value.contains("..");
    }
}
