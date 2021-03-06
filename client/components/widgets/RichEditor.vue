<template>
  <vue-editor
    ref="editor"
    v-model="content"
    v-click-outside="onClickOutside"
    :class="{ editor: true, 'no-border': noBorder }"
    :editor-options="editorSettings"
    :editor-toolbar="customToolbar"
  />
</template>

<script>
import { VueEditor } from "vue2-editor";

export default {
  components: {
    VueEditor
  },
  props: {
    value: {
      type: String,
      default: ""
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    noBorder: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      content: this.value,
      customToolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["code-block", "blockquote"]
      ],
      editorSettings: {
        modules: {
          keyboard: {
            bindings: {
              tab: {
                key: "enter",
                shiftKey: true,
                handler: () => {
                  this.$emit("submit");
                }
              }
            }
          }
        }
      }
    };
  },
  watch: {
    content(content) {
      this.$emit("input", content);
    },
    value() {
      if (this.$refs.editor.quill.root.innerHTML !== this.value) {
        this.$refs.editor.quill.root.innerHTML = this.value;
      }
    }
  },
  mounted() {
    if (this.autofocus) {
      this.$nextTick(() => {
        this.focus();
      });
    }
  },
  methods: {
    focus() {
      this.$refs.editor.quill.focus();
    },
    onClickOutside() {
      this.$emit("click-outside");
    }
  }
};
</script>

<style scoped></style>
<style>
.ql-toolbar svg {
  width: 16px !important;
  height: 16px !important;
}

.ql-editor {
  min-height: 120px !important;
  font-family: Roboto, sans-serif !important;
  font-size: 14px !important;
}

.no-border .ql-toolbar.ql-snow {
  border-left: none;
  border-right: none;
  border-top: none;
}

.no-border .ql-container.ql-snow {
  border: none;
}
</style>
