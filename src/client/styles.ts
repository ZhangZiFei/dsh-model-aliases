export const STYLE_TEXT = `
.dma-selector{position:relative;min-width:0}
.dma-selector__trigger{display:flex;align-items:center;gap:5px;min-width:0;max-width:220px;height:28px;padding:0 8px;color:var(--dsw-alias-label-secondary);background:transparent;border:0;border-radius:24px;cursor:pointer;font:500 13px/20px inherit}
.dma-selector__trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dma-selector__trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.dma-selector__trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dma-selector__label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dma-selector__chevron{flex:none;color:var(--dsw-alias-label-caption);font-size:10px;transition:transform .12s}
.dma-selector__chevron--open{transform:rotate(180deg)}
.dma-selector__menu{position:absolute;right:0;bottom:calc(100% + 8px);z-index:20;display:flex;flex-direction:column;width:min(280px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));padding:4px;overflow:auto;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-inverted);border-radius:12px;box-shadow:var(--dsw-shadow-lv3)}
.dma-selector__item{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;width:100%;padding:8px 10px;color:inherit;text-align:left;background:transparent;border:0;border-radius:8px;cursor:pointer;font:inherit}
.dma-selector__item:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dma-selector__item:disabled{color:var(--dsw-alias-label-dimmed);cursor:not-allowed}
.dma-selector__item-name{display:block;font-size:13px;font-weight:600;line-height:18px}
.dma-selector__item-route{display:block;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;overflow-wrap:anywhere}
.dma-selector__item-state{flex:none;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px}
.dma-selector__message{padding:9px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dma-selector__error{margin:4px;padding:7px 8px;color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger);border-radius:8px;font-size:12px;line-height:18px}
.dma-settings{display:flex;flex-direction:column;gap:18px;max-width:880px;padding:4px 0 32px;color:var(--dsw-alias-label-primary)}
.dma-settings__header h2{margin:0 0 6px;font-size:20px;line-height:28px}
.dma-settings__header p{max-width:720px;margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.dma-settings__notice{padding:10px 12px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-module-platform);border-radius:10px;font-size:12px;line-height:18px}
.dma-settings__error{padding:10px 12px;color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger);border-radius:10px;font-size:12px;line-height:18px}
.dma-settings__list{display:flex;flex-direction:column;gap:12px}
.dma-settings__empty{padding:28px 18px;color:var(--dsw-alias-label-tertiary);text-align:center;border:1px dashed var(--dsw-alias-border-inverted);border-radius:12px;font-size:13px;line-height:20px}
.dma-alias-card{display:grid;grid-template-columns:minmax(130px,1fr) minmax(150px,1.2fr) minmax(180px,1.5fr) minmax(150px,1.1fr) auto;gap:10px;align-items:end;padding:14px;background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-inverted);border-radius:12px}
.dma-field{display:flex;min-width:0;flex-direction:column;gap:6px}
.dma-field span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px}
.dma-field input,.dma-field select{width:100%;min-width:0;height:34px;padding:0 10px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-inverted);border-radius:8px;font:13px/20px inherit;outline:none}
.dma-field input:focus,.dma-field select:focus{border-color:var(--dsw-alias-border-l3);box-shadow:0 0 0 1px var(--dsw-alias-border-l3)}
.dma-field select option{color:CanvasText;background:Canvas}
.dma-button{height:34px;padding:0 14px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-inverted);border-radius:8px;cursor:pointer;font:600 13px/20px inherit}
.dma-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dma-button:disabled{color:var(--dsw-alias-label-dimmed);cursor:not-allowed}
.dma-button--danger{color:var(--dsw-alias-state-error-primary);background:transparent}
.dma-button--primary{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}
.dma-settings__actions{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dma-settings__actions-group{display:flex;align-items:center;gap:10px}
.dma-settings__status{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
@media (max-width:900px){.dma-alias-card{grid-template-columns:1fr 1fr}.dma-alias-card .dma-button--danger{justify-self:start}}
@media (max-width:620px){.dma-alias-card{grid-template-columns:1fr}.dma-settings__actions{align-items:stretch;flex-direction:column}.dma-settings__actions-group{justify-content:space-between}}
`
