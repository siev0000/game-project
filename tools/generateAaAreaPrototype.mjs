import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'src', 'data', 'exploration')

const districts = [
  ['aa_upper_shared', '上層・中央共有区', 'upper', '上層ターミナルと共同管理・観測・物流施設。'],
  ['aa_upper_magitech', '上層・マギテック側', 'upper', 'マギテックの居住、創造、魔力研究、軍事試験区画。'],
  ['aa_upper_eidolon', '上層・エイドロン側', 'upper', 'エイドロンの居住、創造、信仰研究、救助・防衛試験区画。'],
  ['aa_middle_prototype', 'AA中層・仮配置', 'middle', '生活、任務、工房、植物資源生産を担う中層区画。'],
  ['aa_lower_core', '下層・ターミナル／ラストハブ', 'lower', '下層交通と旧型・下位個体の生活拠点。'],
  ['aa_lower_reclaim', '下層・リクレイムベルト', 'lower', '廃機体、部品、金属、燃料を再利用する再生工業地区。'],
  ['aa_lower_hazard_bio', '下層・危険／有機処理区', 'lower', 'アシッドゾーンS9とバイオリアクターを含む処理地区。'],
  ['aa_lower_material', '下層・マテリアル・ホロー', 'lower', '船外資源の吸収、検査、搬送を担う重資源地区。'],
  ['aa_hidden_middle', '秘匿中層', 'hidden_middle', '船体中枢・保安・保守設備を収めた非公開階層。'],
  ['aa_bottom_expedition', '底部外征区', 'bottom_expedition', '部隊の出撃・帰還・空中艦運用を担う船体底部区画。']
].map(([id, name, layer, description]) => ({ id, name, layer, description, areaIds: [] }))

const routes = [
  // 上層・中央共有区
  {
    id: 'upper_terminal_concourse', name: '上層ターミナルコンコース', layer: 'upper',
    districtId: 'aa_upper_shared', width: 3200,
    left: null, right: 'upper_shared_spine',
    description: '上層ターミナルの乗降・案内・検査用コンコース。',
    junctions: []
  },
  {
    id: 'upper_shared_spine', name: '上層中央幹線', layer: 'upper',
    districtId: 'aa_upper_shared', width: 5000, left: 'upper_terminal_concourse', right: 'upper_shared_ring',
    description: '中央共有施設を船首・船尾方向につなぐ主要幹線道路。', junctions: []
  },
  {
    id: 'upper_shared_ring', name: '上層中央環状路', layer: 'upper',
    districtId: 'aa_upper_shared', width: 3600, left: null, right: null, horizontalLoop: true,
    description: 'ターミナル、中央幹線、両認証門を結ぶ地区環状道路。',
    junctions: [
      ['upper_shared_spine', '上層中央幹線', 520, 'rear'],
      ['upper_magitech_gate_corridor', 'マギテック認証通路', 1180],
      ['upper_eidolon_gate_corridor', 'エイドロン認証通路', 2360]
    ]
  },
  {
    id: 'upper_cross_emergency_corridor', name: '上層緊急横断路', layer: 'upper',
    districtId: 'aa_upper_shared', width: 2600,
    left: 'upper_magitech_loop', right: 'upper_eidolon_loop',
    description: '両研究区画を横断する非常用迂回路。通常時は閉鎖される。', junctions: []
  },

  // 上層・マギテック側
  {
    id: 'upper_magitech_gate_corridor', name: 'マギテック認証通路', layer: 'upper',
    districtId: 'aa_upper_magitech', width: 2200,
    left: 'upper_shared_ring', right: 'upper_magitech_trunk',
    description: '中央共有区とマギテック側区画を隔壁・認証門で接続する通路。', junctions: []
  },
  {
    id: 'upper_magitech_trunk', name: 'マギテック中央幹線', layer: 'upper',
    districtId: 'aa_upper_magitech', width: 3000,
    left: 'upper_magitech_gate_corridor', right: 'upper_magitech_loop',
    description: '認証通路から居住区・研究環状路へ続く主要幹線。', junctions: []
  },
  {
    id: 'upper_magitech_loop', name: 'マギテック環状路', layer: 'upper',
    districtId: 'aa_upper_magitech', width: 6200,
    left: 'upper_magitech_trunk', right: 'upper_magitech_freight_tunnel',
    description: 'マギテック側の居住、研究、創造、試験施設を結ぶ環状道路。',
    junctions: [['upper_cross_emergency_corridor', '上層緊急横断路', 5520]]
  },
  {
    id: 'upper_magitech_freight_tunnel', name: 'マギテック貨物トンネル', layer: 'upper',
    districtId: 'aa_upper_magitech', width: 3600,
    left: 'upper_magitech_loop', right: null,
    description: '素材・燃料・試作機を物流区から研究施設へ運ぶ密閉貨物路。', junctions: []
  },

  // 上層・エイドロン側
  {
    id: 'upper_eidolon_gate_corridor', name: 'エイドロン認証通路', layer: 'upper',
    districtId: 'aa_upper_eidolon', width: 2200,
    left: 'upper_shared_ring', right: 'upper_eidolon_trunk',
    description: '中央共有区とエイドロン側区画を隔壁・認証門で接続する通路。', junctions: []
  },
  {
    id: 'upper_eidolon_trunk', name: 'エイドロン中央幹線', layer: 'upper',
    districtId: 'aa_upper_eidolon', width: 3000,
    left: 'upper_eidolon_gate_corridor', right: 'upper_eidolon_loop',
    description: '認証通路から居住区・研究環状路へ続く主要幹線。', junctions: []
  },
  {
    id: 'upper_eidolon_loop', name: 'エイドロン環状路', layer: 'upper',
    districtId: 'aa_upper_eidolon', width: 6500,
    left: 'upper_eidolon_trunk', right: 'upper_eidolon_freight_tunnel',
    description: 'エイドロン側の居住、研究、創造、試験施設を結ぶ環状道路。',
    junctions: [['upper_cross_emergency_corridor', '上層緊急横断路', 5780]]
  },
  {
    id: 'upper_eidolon_freight_tunnel', name: 'エイドロン貨物トンネル', layer: 'upper',
    districtId: 'aa_upper_eidolon', width: 3600,
    left: 'upper_eidolon_loop', right: null,
    description: '生命試料・装備・製造部品を研究施設へ運ぶ密閉貨物路。', junctions: []
  },

  // 中層
  {
    id: 'middle_terminal_concourse', name: '中層ターミナルコンコース', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3000,
    left: null, right: 'middle_public_ring',
    description: '中央ターミナル塔の乗降・案内・検査用コンコース。',
    junctions: []
  },
  {
    id: 'middle_public_ring', name: '中層中央環状路', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 4800, horizontalLoop: true,
    left: null, right: null,
    description: '中層の各地区へ分岐する主要幹線道路。',
    junctions: [
      ['middle_terminal_concourse', '中層ターミナルコンコース', 520, 'rear'],
      ['middle_refine_service_road', 'リファイン工房道路', 1460],
      ['middle_arbora_boulevard', 'アルボラ大通り', 2850],
      ['middle_industrial_freight_road', '中層工業貨物幹線', 3560],
      ['middle_emergency_bypass', '中層非常迂回環状路', 4160],
      ['middle_mission_avenue', '任務大通り', 4520, 'front']
    ]
  },
  {
    id: 'middle_refine_service_road', name: 'リファイン工房道路', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3200, left: 'middle_public_ring', right: null,
    description: 'リファインバレーと装備開発ラボを結ぶ工房道路。', junctions: []
  },
  {
    id: 'middle_mission_avenue', name: '任務大通り', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3400,
    left: 'middle_public_ring', right: 'middle_resist_internal_corridor',
    description: '中央環状路からレジストリンク・ドームへ続く任務用幹線。', junctions: []
  },
  {
    id: 'middle_resist_internal_corridor', name: 'ドーム内部連絡通路', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 2800, left: 'middle_mission_avenue', right: null,
    description: '受付、報酬、作戦室、倉庫をつなぐドーム内部の歩行通路。', junctions: []
  },
  {
    id: 'middle_arbora_boulevard', name: 'アルボラ大通り', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3000,
    left: 'middle_public_ring', right: 'middle_arbora_loop',
    description: '中央環状路からアルボラセクターへ向かう主要幹線。', junctions: []
  },
  {
    id: 'middle_arbora_loop', name: 'アルボラ管理環状路', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 4600,
    left: 'middle_arbora_boulevard', right: 'middle_botanical_service_tunnel',
    description: '温室群と生物資源管理施設を結ぶ地区環状道路。', junctions: []
  },
  {
    id: 'middle_botanical_service_tunnel', name: '植物管理トンネル', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3000, left: 'middle_arbora_loop', right: null,
    description: '水・土壌、温室、生物管理、研究温室の保守用通路。', junctions: []
  },
  {
    id: 'middle_industrial_freight_road', name: '中層工業貨物幹線', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 4800,
    left: 'middle_public_ring', right: 'middle_cargo_tunnel',
    description: '燃料・植物加工施設を結ぶ重貨物道路。', junctions: []
  },
  {
    id: 'middle_cargo_tunnel', name: '中層貨物トンネル', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3200,
    left: 'middle_industrial_freight_road', right: null,
    description: '貨物検査区、工業貨物幹線、中央貨物リフトを結ぶ専用トンネル。', junctions: []
  },
  {
    id: 'middle_emergency_bypass', name: '中層非常迂回環状路', layer: 'middle',
    districtId: 'aa_middle_prototype', width: 3600, left: 'middle_public_ring', right: null,
    description: '主経路閉鎖時に使用する中層外周の非常用迂回路。', junctions: []
  },

  // 下層
  {
    id: 'lower_terminal_concourse', name: '下層ターミナルコンコース', layer: 'lower',
    districtId: 'aa_lower_core', width: 3000,
    left: null, right: 'last_hub_ring',
    description: '下層ターミナルの乗降・装備検査・危険区認証コンコース。',
    junctions: []
  },
  {
    id: 'last_hub_ring', name: 'ラストハブ環状路', layer: 'lower',
    districtId: 'aa_lower_core', width: 4800, horizontalLoop: true,
    left: null, right: null,
    description: '下層生活区と各産業幹線を結ぶ地区環状道路。',
    junctions: [
      ['lower_terminal_concourse', '下層ターミナルコンコース', 520, 'rear'],
      ['lower_hazard_corridor', 'S9危険物隔離通路', 1760],
      ['lower_organic_corridor', '有機処理密閉路', 2460],
      ['lower_material_hollow_road', '重資源搬送路', 3180],
      ['lower_emergency_bypass', '下層非常迂回環状路', 3820],
      ['lower_junk_maintenance_path', '廃整備用旧通路', 4320],
      ['lower_reclaim_spine', '再生工業幹線', 4520, 'front']
    ]
  },
  {
    id: 'lower_reclaim_spine', name: '再生工業幹線', layer: 'lower',
    districtId: 'aa_lower_reclaim', width: 6200,
    left: 'last_hub_ring', right: 'lower_recycled_export_tunnel',
    description: '搬入登録、分類、部品回収、再精錬、倉庫を結ぶ重貨物道路。',
    junctions: [['lower_propulsion_service_road', '船尾機関整備道路', 5500]]
  },
  {
    id: 'lower_recycled_export_tunnel', name: '再生資源上送トンネル', layer: 'lower',
    districtId: 'aa_lower_reclaim', width: 3000, left: 'lower_reclaim_spine', right: null,
    description: '再生資源倉庫と中央貨物リフトを結ぶ上送貨物トンネル。', junctions: []
  },
  {
    id: 'lower_hazard_corridor', name: 'S9危険物隔離通路', layer: 'lower',
    districtId: 'aa_lower_hazard_bio', width: 5200,
    left: 'last_hub_ring', right: 'lower_security_seal_route',
    description: '一般・管理・危険処理区と特別隔離区を密閉接続する危険物通路。', junctions: []
  },
  {
    id: 'lower_organic_corridor', name: '有機処理密閉路', layer: 'lower',
    districtId: 'aa_lower_hazard_bio', width: 5200,
    left: 'last_hub_ring', right: 'lower_bio_return_tunnel',
    description: '有機廃棄物搬入口から処理槽・汚泥・廃熱回収へ続く密閉路。', junctions: []
  },
  {
    id: 'lower_bio_return_tunnel', name: 'バイオ資源還流トンネル', layer: 'lower',
    districtId: 'aa_lower_hazard_bio', width: 3000, left: 'lower_organic_corridor', right: null,
    description: '回収した水・肥料・燃料成分を中央貨物リフトと中層へ返す貨物路。', junctions: []
  },
  {
    id: 'lower_security_seal_route', name: '危険区封鎖操作路', layer: 'lower',
    districtId: 'aa_lower_hazard_bio', width: 2600, left: 'lower_hazard_corridor', right: null,
    description: '緊急隔離施設と隔壁・排水・電力制御を結ぶ警備通路。', junctions: []
  },
  {
    id: 'lower_material_hollow_road', name: '重資源搬送路', layer: 'lower',
    districtId: 'aa_lower_material', width: 5200,
    left: 'last_hub_ring', right: null,
    description: '異物検査、仮置場、マテリアル・ホロー、外部吸収口を結ぶ重貨物道路。', junctions: []
  },
  {
    id: 'lower_emergency_bypass', name: '下層非常迂回環状路', layer: 'lower',
    districtId: 'aa_lower_core', width: 3800, left: 'last_hub_ring', right: null,
    description: '各主要幹線と避難所をつなぐ下層外周の非常用迂回路。', junctions: []
  },
  {
    id: 'lower_junk_maintenance_path', name: '廃整備用旧通路', layer: 'lower',
    districtId: 'aa_lower_core', width: 2600, left: 'last_hub_ring', right: null,
    description: '公式案内に表示されないジャンク・リビルド槽への旧整備通路。', junctions: []
  },
  {
    id: 'lower_propulsion_service_road', name: '船尾機関整備道路', layer: 'lower',
    districtId: 'aa_lower_reclaim', width: 3200, left: 'lower_reclaim_spine', right: null,
    description: '再精錬・廃熱設備から船尾推進設備へ続く重貨物整備道路。', junctions: []
  },

  // 秘匿中層
  {
    id: 'hidden_control_ring', name: '秘匿中枢接続環状路', layer: 'hidden_middle',
    districtId: 'aa_hidden_middle', width: 4600, left: null, right: 'hidden_core_service_corridor',
    description: 'シューシンター制御室と船体主要中枢を接続する秘匿環状路。',
    junctions: []
  },
  {
    id: 'hidden_core_service_corridor', name: '中枢保守通路', layer: 'hidden_middle',
    districtId: 'aa_hidden_middle', width: 3200,
    left: 'hidden_control_ring', right: 'hidden_security_ring',
    description: '全階層接続設備と中枢保守区へ通じる専用作業通路。',
    junctions: []
  },
  {
    id: 'hidden_security_ring', name: '秘匿封鎖環', layer: 'hidden_middle',
    districtId: 'aa_hidden_middle', width: 2800,
    left: 'hidden_core_service_corridor', right: 'hidden_emergency_escape',
    description: '侵入検知、経路遮断、中枢防護を担う多重封鎖環。',
    junctions: []
  },
  {
    id: 'hidden_emergency_escape', name: '秘匿非常脱出路', layer: 'hidden_middle',
    districtId: 'aa_hidden_middle', width: 2400,
    left: 'hidden_security_ring', right: null,
    description: '接続先を未確定のまま保持する、秘匿中層専用の非常脱出路。',
    junctions: []
  },

  // 底部外征区
  {
    id: 'expedition_departure_spine', name: '外征出撃幹線', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 5200,
    left: null, right: 'expedition_launch_branch_port',
    description: '直通リフトから集合、検査、搭乗、左舷発進区へ続く出撃専用幹線。',
    junctions: [
      ['expedition_launch_branch_starboard', '右舷発進路', 3500],
      ['expedition_hangar_service_road', '格納庫整備道路', 4150],
      ['expedition_emergency_crossroute', '外征区非常横断路', 4680]
    ]
  },
  {
    id: 'expedition_launch_branch_port', name: '左舷発進路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 3000,
    left: 'expedition_departure_spine', right: null,
    description: '出撃幹線から左舷側発進区へ分岐する発進専用路。',
    junctions: []
  },
  {
    id: 'expedition_launch_branch_starboard', name: '右舷発進路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 3000,
    left: 'expedition_departure_spine', right: null,
    description: '出撃幹線から右舷側発進区へ分岐する発進専用路。',
    junctions: []
  },
  {
    id: 'expedition_return_corridor', name: '外征帰還隔離路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 4200,
    left: 'expedition_emergency_crossroute', right: null,
    description: '帰還者と回収物を出撃系統から隔離し、検査・回収設備へ送る専用路。',
    junctions: []
  },
  {
    id: 'expedition_hangar_service_road', name: '格納庫整備道路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 4000,
    left: 'expedition_departure_spine', right: 'expedition_large_dock_port_road',
    description: '空中艦格納庫、外征貨物庫、左舷大型艦ドックを結ぶ整備道路。',
    junctions: [['expedition_large_dock_starboard_road', '右舷大型艦接続路', 3200]]
  },
  {
    id: 'expedition_large_dock_port_road', name: '左舷大型艦接続路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 2800,
    left: 'expedition_hangar_service_road', right: null,
    description: '左舷側の半露天式大型艦ドックへ通じる気密接続路。',
    junctions: []
  },
  {
    id: 'expedition_large_dock_starboard_road', name: '右舷大型艦接続路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 2800,
    left: 'expedition_hangar_service_road', right: null,
    description: '右舷側の半露天式大型艦ドックへ通じる気密接続路。',
    junctions: []
  },
  {
    id: 'expedition_emergency_crossroute', name: '外征区非常横断路', layer: 'bottom_expedition',
    districtId: 'aa_bottom_expedition', width: 2800,
    left: 'expedition_departure_spine', right: 'expedition_return_corridor',
    description: '通常時は分離された出撃系統と帰還系統を緊急時だけ結ぶ横断路。',
    junctions: []
  }
]

const facilities = [
  // 上層中央共有
  ['upper_terminal', '上層ターミナル', '上層の共同玄関。各研究区画と底部外征区への人員移動を管理する。', 'terminal', 'upper_terminal_concourse'],
  ['upper_main_control', '上層共同メインコントロール', '共同管理者が階層運用、交通、物流、事故対応を調整する施設。', 'control', 'upper_shared_spine'],
  ['orbital_sphere', 'オービタルスフィア', '船内・船外・周辺空域の観測情報を統合する戦略観測施設。', 'observation', 'upper_shared_spine'],
  ['information_archive', '上層共通情報保存区', '研究、観測、管理、歴史、任務記録を機密度別に保管する。', 'archive', 'upper_shared_spine'],
  ['myosphere_field', 'マイオスフィールド', '精神緩和、交流、娯楽、思考切替に利用する空間。', 'recreation', 'upper_shared_spine'],
  ['upper_shared_logistics', '上層共通物流区', '中層・下層から届く素材、部品、燃料を検査・分配する。', 'cargo', 'upper_shared_spine'],
  ['upper_shared_high_grade_fuel', '上層高級燃料供給区', '高性能試作機と魔法機構向け高級燃料を保管・配給する。', 'fuel', 'upper_shared_spine'],
  ['upper_shared_security_magitech', 'マギテック側認証門', '中央共有区とマギテック側研究区画の認証・検査境界。', 'security', 'upper_magitech_gate_corridor'],
  ['upper_shared_security_eidolon', 'エイドロン側認証門', '中央共有区とエイドロン側研究区画の認証・検査境界。', 'security', 'upper_eidolon_gate_corridor'],

  // 上層マギテック
  ['magitech_residential_area', 'マギテック側居住・待機区', '第4世代、魔力研究担当、警備・試験担当の生活拠点。', 'residential', 'upper_magitech_trunk'],
  ['magitech_update_facility', 'マギテック・アップデート施設', '機体機能、魔法術式、宝珠制御、判断系を更新する。', 'update', 'upper_magitech_loop'],
  ['magitech_creation_area', 'マギテック創造領域', 'マギテック系機体、魔力機構、試作装備を設計・製造する中核工房。', 'factory', 'upper_magitech_loop'],
  ['magitech_weapon_development', 'マギテック武器開発施設', '宝珠魔法、属性兵装、魔法シールド関連装備を開発する。', 'laboratory', 'upper_magitech_loop'],
  ['magitech_research_facility', '魔力系研究施設', '三宝珠炉、伝導路、属性、術式、冷却などの基礎研究施設。', 'laboratory', 'upper_magitech_loop'],
  ['magitech_force_field_lab', '力場シールド研究区', '魔法シールド、属性防御、局所力場の強度と効率を研究する。', 'laboratory', 'upper_magitech_loop'],
  ['magitech_attribute_test_area', '属性実験区画', '炎、雷、冷気などの属性魔法と素材・機体への影響を試験する。', 'test', 'upper_magitech_loop'],
  ['magitech_combat_test_range', 'マギテック戦闘試験場', '機体、兵装、シールドを実戦形式で試験する可変戦闘区。', 'combat', 'upper_magitech_loop'],
  ['magitech_prototype_test_facility', 'マギテック試作試験施設', '戦闘試験場内の試作機・試作兵装専用棟。', 'test', 'upper_magitech_loop'],
  ['magitech_high_grade_fuel_lab', 'マギテック高級燃料研究施設', '高出力魔導機構向け燃料の研究・少量製造を行う。', 'fuel', 'upper_magitech_freight_tunnel'],
  ['magitech_secure_storage', 'マギテック高機密保管区', '危険な宝珠、試作兵器、研究素体、未承認設計を保管する。', 'secure', 'upper_magitech_loop'],
  ['magitech_military_research_area', 'マギテック軍事研究区', '制圧、飛行、近接、魔導砲撃に特化した軍事研究区。', 'military', 'upper_magitech_loop'],

  // 上層エイドロン
  ['eidolon_residential_area', 'エイドロン側居住・待機区', '第5世代、信仰研究、救助・観測・警備担当の生活拠点。', 'residential', 'upper_eidolon_trunk'],
  ['eidolon_update_facility', 'エイドロン・アップデート施設', '機体構造、信仰魔法制御、聖結界、任務支援機能を更新する。', 'update', 'upper_eidolon_loop'],
  ['eidolon_creation_area', 'エイドロン創造領域', '生命構造対応フレーム、信仰魔法機構、支援装備を製造する。', 'factory', 'upper_eidolon_loop'],
  ['eidolon_support_equipment_development', 'エイドロン装備開発施設', '盾、救助、観測、捕縛、通信などの任務支援装備を開発する。', 'laboratory', 'upper_eidolon_loop'],
  ['eidolon_faith_research_facility', '信仰系研究施設', '信仰反応、信仰魔法、聖結界、光輝能力の成立条件を研究する。', 'laboratory', 'upper_eidolon_loop'],
  ['eidolon_barrier_lab', '聖結界研究区', '物理・魔法を防ぐ聖結界の強度、範囲、維持を研究する。', 'laboratory', 'upper_eidolon_loop'],
  ['eidolon_radiant_test_area', '光輝魔法実験区画', '光輝魔法の出力、射程、安定性、対象への影響を試験する。', 'test', 'upper_eidolon_loop'],
  ['eidolon_life_structure_lab', '生命構造研究区', '生物性、無機物性、機械構造、生命構造の適合を研究する。', 'laboratory', 'upper_eidolon_freight_tunnel'],
  ['eidolon_combat_test_range', 'エイドロン戦闘試験場', '結界、光輝魔法、支援装備、救助・捕縛能力を実戦試験する。', 'combat', 'upper_eidolon_loop'],
  ['eidolon_prototype_test_facility', 'エイドロン試作試験施設', '戦闘試験場内の試作機・試作支援装備専用棟。', 'test', 'upper_eidolon_loop'],
  ['eidolon_sample_storage', '信仰系試料保管区', '生体、グロウメタ、機械・生体複合試料を隔離保管する。', 'secure', 'upper_eidolon_freight_tunnel'],
  ['eidolon_secure_storage', 'エイドロン高機密保管区', '危険試料、計画記録、未承認装備、特殊部品を保管する。', 'secure', 'upper_eidolon_loop'],
  ['eidolon_military_research_area', 'エイドロン軍事研究区', '広域防衛、制圧、救助、指揮、上位派生を研究する。', 'military', 'upper_eidolon_loop'],

  // 中層
  ['middle_terminal', '中層ターミナル', '各階層を結ぶ一般移動の玄関口。', 'terminal', 'middle_terminal_concourse'],
  ['core_shell_refine', 'コアシェル・リファイン', '中央ターミナル外周に広がる生活・商業の円環地区。', 'town', 'middle_public_ring'],
  ['core_shell_town', 'コアシェルタウン', '充電、洗浄、市場、交流、娯楽を集約した中層生活区。', 'town', 'middle_public_ring'],
  ['refine_valley', 'リファインバレー', '整備、医療、装備改修を担う工房地区。', 'workshop', 'middle_refine_service_road'],
  ['alchimeria_lab', 'アルキメリア装備開発ラボ', '装備の開発・解析・改修を行う中層技術ラボ。', 'laboratory', 'middle_refine_service_road'],
  ['resist_link_dome', 'レジストリンク・ドーム', 'クエスト、任務、作戦、報酬を集約する任務拠点。', 'mission', 'middle_mission_avenue'],
  ['arbora_sector', 'アルボラセクター', '燃料、繊維、樹脂、生体素材を生産する植物資源地区。', 'greenhouse', 'middle_arbora_loop'],
  ['ecosystem_greenhouses', '生態系再現温室群', '複数の生態環境を再現する大規模温室群。', 'greenhouse', 'middle_arbora_loop'],
  ['water_soil_cycle', '水・土壌循環施設', '温室群の水・土壌・養分循環を維持する。', 'infrastructure', 'middle_arbora_loop'],
  ['biological_management', '生物・植物管理施設', '生物・植物個体の登録、健康、隔離を管理する。', 'laboratory', 'middle_arbora_loop'],
  ['bio_material_greenhouse', 'バイオ素材研究温室', '特殊植物と生体素材を研究・栽培する。', 'greenhouse', 'middle_arbora_loop'],
  ['standard_fuel_factory', '標準燃料生産施設', '中層全域へ供給する標準燃料を生産する。', 'factory', 'middle_industrial_freight_road'],
  ['plant_oil_processing', '植物油加工区', '植物原料から燃料・潤滑用の油を抽出する。', 'factory', 'middle_industrial_freight_road'],
  ['fiber_resin_processing', '植物繊維・樹脂加工区', '植物繊維と樹脂を建材・装備素材へ加工する。', 'factory', 'middle_industrial_freight_road'],
  ['middle_material_processing', '植物資源加工施設', '植物資源を各種工業素材へ加工・分配する。', 'factory', 'middle_industrial_freight_road'],
  ['middle_cargo_inspection', '中層貨物検査区', '階層間貨物の登録、検査、汚染確認を行う。', 'cargo', 'middle_cargo_tunnel'],

  // 下層
  ['lower_terminal', '下層ターミナル', '下層生活区、再処理区、危険処理区への交通拠点。', 'terminal', 'lower_terminal_concourse'],
  ['last_hub', 'ラストハブ', '旧型・下位個体、処理作業員、回収業者が暮らす下層生活区。', 'town', 'last_hub_ring'],
  ['heavy_machinery_maintenance', '重機整備区', '大型作業機、牽引機、解体重機を整備する。', 'workshop', 'last_hub_ring'],
  ['junk_rebuild_tank', 'ジャンク・リビルド槽', '廃材、旧型部品、危険素材を扱う非公式改造場。', 'workshop', 'lower_junk_maintenance_path'],
  ['reclaim_belt', 'リクレイムベルト', '廃部品、残骸、廃機体、廃装備を検査・再利用する地区。', 'factory', 'lower_reclaim_spine'],
  ['discard_registration', '廃棄物搬入登録区', '搬入元、内容、所有権、事故記録、危険性を登録する。', 'cargo', 'lower_reclaim_spine'],
  ['waste_inspection_classification', '廃棄物検査・分類区', '材質、残留エネルギー、汚染、自律機能を検査・分類する。', 'inspection', 'lower_reclaim_spine'],
  ['discarded_machine_inspection', '廃機体事前検査区', '破損個体を廃材として処理してよいか魂・人格・記憶を検査する。', 'inspection', 'lower_reclaim_spine'],
  ['parts_recovery_area', '部品回収区', '再使用可能部品を取り外し、洗浄、検査、規格分類する。', 'factory', 'lower_reclaim_spine'],
  ['metal_re_refining_area', '金属再精錬区', '廃金属から不純物を除去し、金属インゴットへ戻す。', 'factory', 'lower_reclaim_spine'],
  ['recycled_resource_storage', '再生資源倉庫', '再使用部品、金属インゴット、回収資源を保管・返送する。', 'cargo', 'lower_reclaim_spine'],
  ['fuel_discharge_neutralization', '燃料・電池放電中和施設', '使用済み燃料、電池、冷却液、残留魔力を除去・中和する。', 'hazard', 'lower_reclaim_spine'],
  ['acid_zone_s9', 'アシッドゾーンS9', '腐食性廃液、高熱、危険燃料、暴走兵器を扱う危険処理地区。', 'hazard', 'lower_hazard_corridor'],
  ['lower_general_processing', '一般処理区', '低危険度の生活廃棄物、金属屑、植物残渣を処理する。', 'factory', 'lower_hazard_corridor'],
  ['lower_managed_processing', '管理処理区', '燃料、電池、冷却液、腐食性廃液を管理下で処理する。', 'hazard', 'lower_hazard_corridor'],
  ['lower_hazardous_processing', '危険処理区', '爆発性試作品、暴走兵器、高温部品を遠隔処理する。', 'hazard', 'lower_hazard_corridor'],
  ['lower_special_isolation', '特別隔離区', 'グロウメタ、自己増殖素材、未知組織を多重隔壁内へ隔離する。', 'secure', 'lower_hazard_corridor'],
  ['lower_emergency_isolation', '緊急隔離施設', 'S9の隔壁、空気、排水、電力、搬送路を緊急遮断する。', 'control', 'lower_security_seal_route'],
  ['bioreactor', 'バイオリアクター', '有機系廃棄物から残存エネルギーと再利用成分を回収する。', 'factory', 'lower_organic_corridor'],
  ['organic_waste_intake', '有機廃棄物搬入口', '有機物を登録、検査、前処理して密閉搬入する。', 'cargo', 'lower_organic_corridor'],
  ['biological_treatment_tanks', 'バイオ処理槽', '有機物をガス、燃料成分、水、肥料成分へ分ける。', 'factory', 'lower_organic_corridor'],
  ['sludge_treatment_area', '汚泥処理区', '処理汚泥を脱水、分離、肥料化、隔離する。', 'factory', 'lower_organic_corridor'],
  ['waste_heat_recovery', '廃熱回収区', '処理槽、精錬、エンジン、生活区の廃熱を再利用する。', 'infrastructure', 'lower_organic_corridor'],
  ['reusable_component_recovery', '再利用成分回収区', '浄化水、肥料、ガス、再生燃料を調整して中層へ返す。', 'factory', 'lower_bio_return_tunnel'],
  ['material_hollow', 'マテリアル・ホロー', '地上・船外から大量の資源を吸収・搬入する旧式設備。', 'factory', 'lower_material_hollow_road'],
  ['foreign_object_inspection', '異物検査区', '資源に混入した生物、兵器、汚染物、古代装置を検査する。', 'inspection', 'lower_material_hollow_road'],
  ['resource_temporary_storage', '大型資源仮置場', '検査前の大型資源を固定・分割する一時保管場所。', 'cargo', 'lower_material_hollow_road'],
  ['external_resource_intake', '外部資源吸収設備', '岩石、金属塊、廃墟残骸、地上資源を船内へ取り込む。', 'factory', 'lower_material_hollow_road'],

  // 秘匿中層
  ['hidden_middle_shushinter_control', 'シューシンター・コントロール室', 'シューシンターがAA全域のシステム、魔法機構、動力、航行、封鎖、通信と相互作用する中枢。', 'control', 'hidden_control_ring'],
  ['hidden_middle_magic_core', '船体全域魔法作用中枢', '浮遊補助、船体保護、構造安定などの全船規模の魔法的効果を維持する。', 'magic', 'hidden_control_ring'],
  ['hidden_middle_power_core', '船体主要動力装置', '各階層の発電・燃料・回収系統を統合し、AAの主要システムへ動力を供給する。', 'power', 'hidden_control_ring'],
  ['hidden_middle_flight_control', '浮遊・航行・推進制御装置', 'AAの浮遊、姿勢、航行、速度、旋回、船尾推進設備を統合制御する。', 'control', 'hidden_control_ring'],
  ['hidden_middle_magic_control', '船体全域魔法制御装置', '各階層の魔法設備、魔力反応、魔法事故、全船術式を調整する。', 'magic', 'hidden_control_ring'],
  ['hidden_middle_system_link', '全階層システム接続設備', '動力、通信、航行、隔壁、空調など全階層の主要系統を最短で接続する。', 'infrastructure', 'hidden_core_service_corridor'],
  ['hidden_middle_maintenance', '秘匿中層保守区', '中枢機器の点検、部品交換、冷却、修復を行う専用保守区。', 'workshop', 'hidden_core_service_corridor'],
  ['hidden_middle_security', '秘匿中層保安・封鎖設備', '存在隠蔽、侵入検知、経路遮断、中枢機器防護を担う多重保安設備。', 'security', 'hidden_security_ring'],

  // 底部外征区
  ['expedition_direct_lift', '外征用直通リフト乗降所', '上層ターミナルと底部外征区を中間階層へ停止せず直結する。', 'terminal', 'expedition_departure_spine'],
  ['expedition_assembly_area', '部隊集合・任務確認区', '出撃部隊の最終集合、点呼、指揮系統、任務内容を確認する。', 'mission', 'expedition_departure_spine'],
  ['expedition_final_check', '装備受取・最終検査区', '任務装備を受け取り、通信同期と機体の出撃可否を最終確認する。', 'inspection', 'expedition_departure_spine'],
  ['expedition_boarding_area', '搭乗・出撃準備区', '輸送艇・空中艦への搭乗または直接発進に向けた準備を行う。', 'terminal', 'expedition_departure_spine'],
  ['expedition_launch_bay_port', '左舷側発進区', '小型艇、中型空輸艦、飛行型・降下型オートマンを左舷から発進させる。', 'launch', 'expedition_launch_branch_port'],
  ['expedition_launch_bay_starboard', '右舷側発進区', '小型艇、中型空輸艦、飛行型・降下型オートマンを右舷から発進させる。', 'launch', 'expedition_launch_branch_starboard'],
  ['expedition_recovery_bay', '帰還・回収区', '帰還した個体、輸送艇、回収物、負傷者、損傷機を受け入れる。', 'recovery', 'expedition_return_corridor'],
  ['expedition_contamination_check', '汚染・グロウメタ検査区', '帰還した個体・装備・物資を検査し、外部汚染の船内流入を防ぐ。', 'inspection', 'expedition_return_corridor'],
  ['expedition_damage_recovery', '負傷個体・損傷機回収区', '重傷個体と損傷機を安定化し、各階層の整備・医療区へ送る。', 'recovery', 'expedition_return_corridor'],
  ['bottom_airship_hangar', '小型・中型空中艦格納庫', '小型空挺艇と中型空輸艦を格納、整備、補給する。', 'hangar', 'expedition_hangar_service_road'],
  ['bottom_expedition_cargo', '外征貨物庫', '外征任務用の燃料、弾薬、部品、救助物資、調査装備を保管する。', 'cargo', 'expedition_hangar_service_road'],
  ['bottom_external_dock_port', '左舷側半露天式大型艦ドック', '大型空中艦を左舷外殻へ係留し、搭乗、補給、整備する。', 'dock', 'expedition_large_dock_port_road'],
  ['bottom_external_dock_starboard', '右舷側半露天式大型艦ドック', '大型空中艦を右舷外殻へ係留し、搭乗、補給、整備する。', 'dock', 'expedition_large_dock_starboard_road']
].map(([id, name, description, facilityType, routeId]) => ({
  id, name, description, facilityType, routeId
}))

const routeById = new Map(routes.map(route => [route.id, route]))
const facilitiesByRoute = new Map()
for (const facility of facilities) {
  const list = facilitiesByRoute.get(facility.routeId) ?? []
  list.push(facility)
  facilitiesByRoute.set(facility.routeId, list)
}

const routeEntrySpawn = (routeId, fromRouteId) => {
  const route = routeById.get(routeId)
  if (!route) return 'entry_left'
  if (route.left === fromRouteId) return 'entry_left'
  if (route.right === fromRouteId) return 'entry_right'
  return `junction_${fromRouteId}`
}

const baseArea = ({
  id,
  name,
  description,
  kind,
  width,
  layer,
  districtId,
  horizontalLoop = false,
  mapUiTheme = 'electronic_sf',
  terrainType = 'artificial'
}) => ({
  id,
  name,
  description,
  areaKind: kind,
  layer,
  districtId,
  scene: `areas/aa/${layer}/${id}`,
  map: `maps/aa/${layer}/${id}`,
  bgm: `aa_${layer}_${kind}`,
  width,
  horizontalLoop,
  mapUiTheme,
  terrainType,
  defaultSpawn: kind === 'route' ? 'entry_left' : 'entrance_main',
  spawns: [],
  exits: [],
  enemyFormations: [],
  environment: {
    lighting: layer === 'upper'
      ? 'upper_clean_light'
      : layer === 'lower'
        ? 'lower_industrial_low'
        : layer === 'hidden_middle'
          ? 'hidden_core_low'
          : layer === 'bottom_expedition'
            ? 'expedition_hangar_light'
            : 'middle_industrial_day',
    weather: 'none',
    hazards: layer === 'lower' && /hazard|acid|organic/.test(id) ? ['industrial_hazard'] : [],
    cameraMode: 'side_scroll'
  },
  backgrounds: kind === 'route'
    ? [`aa_${layer}_far`, `aa_${layer}_route`, `aa_${layer}_foreground`]
    : [`aa_${layer}_facility_wall`, `aa_${layer}_equipment`, `aa_${layer}_foreground`],
  requiredEventFlags: []
})

const routeAreas = routes.map(route => {
  const area = baseArea({ ...route, kind: 'route' })
  area.spawns.push(
    { id: 'entry_left', label: '左端から', x: 90, y: 0 },
    { id: 'entry_right', label: '右端から', x: route.width - 90, y: 0 }
  )

  if (route.left) {
    const isLoopEdge = route.loop && route.left === route.id
    area.exits.push({
      id: 'edge_left', label: isLoopEdge ? `${route.name}を一周` : `${routeById.get(route.left).name}へ`,
      connectionType: 'edge', edge: 'left', x: 36,
      destinationArea: route.left,
      destinationSpawn: isLoopEdge ? 'entry_right' : routeEntrySpawn(route.left, route.id),
      requiredEventFlags: []
    })
  }
  if (route.right) {
    const isLoopEdge = route.loop && route.right === route.id
    area.exits.push({
      id: 'edge_right', label: isLoopEdge ? `${route.name}を一周` : `${routeById.get(route.right).name}へ`,
      connectionType: 'edge', edge: 'right', x: route.width - 36,
      destinationArea: route.right,
      destinationSpawn: isLoopEdge ? 'entry_left' : routeEntrySpawn(route.right, route.id),
      requiredEventFlags: []
    })
  }

  const attachedFacilities = facilitiesByRoute.get(route.id) ?? []
  attachedFacilities.forEach((facility, index) => {
    const x = Math.round(route.width * (index + 1) / (attachedFacilities.length + 1))
    area.spawns.push({ id: `entrance_${facility.id}`, label: `${facility.name}前`, x, y: 0 })
    area.exits.push({
      id: `enter_${facility.id}`, label: facility.name,
      connectionType: 'entrance', depthDirection: 'rear', x,
      destinationArea: facility.id, destinationSpawn: 'entrance_main',
      requiredEventFlags: []
    })
  })

  route.junctions.forEach(([junctionId, junctionName, x, requestedDepth], index) => {
    const depthDirection = requestedDepth ?? (index % 2 === 0 ? 'rear' : 'front')
    area.spawns.push({ id: `junction_${junctionId}`, label: `${junctionName}分岐`, x, y: 0 })
    area.exits.push({
      id: `junction_${junctionId}`, label: junctionName,
      connectionType: 'junction', depthDirection, x,
      destinationArea: junctionId,
      destinationSpawn: routeEntrySpawn(junctionId, route.id),
      requiredEventFlags: []
    })
  })
  return area
})

const facilityAreas = facilities.map(facility => {
  const route = routeById.get(facility.routeId)
  const area = baseArea({
    ...facility,
    kind: 'facility',
    width: 1800,
    layer: route.layer,
    districtId: route.districtId
  })
  area.facilityType = facility.facilityType
  area.spawns = [{ id: 'entrance_main', label: '正面入口', x: 160, y: 0 }]
  area.exits = [{
    id: 'exit_to_route', label: `${route.name}へ戻る`,
    connectionType: 'entrance', depthDirection: 'rear', x: 150,
    destinationArea: route.id,
    destinationSpawn: `entrance_${facility.id}`,
    requiredEventFlags: []
  }]
  return area
})

const areas = [...routeAreas, ...facilityAreas]
for (const district of districts) {
  district.areaIds = areas.filter(area => area.districtId === district.id).map(area => area.id)
}

const routeEvents = {
  middle_resist_internal_corridor: [
    ['quest_reception', 'クエスト受付', 620],
    ['operation_room', '作戦室', 1380],
    ['reward_counter', '報酬受取所', 2160]
  ],
  upper_shared_spine: [
    ['joint_command', '共同管理連絡点', 1450],
    ['observation_link', '観測情報接続点', 3650]
  ],
  lower_hazard_corridor: [
    ['acid_warning', '耐酸装備確認', 820],
    ['seal_checkpoint', '危険区隔壁', 4480]
  ]
}

const editorMapDefaults = area => ({
  backgroundLayers: {
    far: { assetId: area.backgrounds?.[0] ?? '', parallax: 0.2, visible: true },
    mid: { assetId: area.backgrounds?.[1] ?? '', parallax: 0.5, visible: true },
    foreground: { assetId: area.backgrounds?.[2] ?? '', parallax: 1.15, visible: true }
  },
  playerPresentation: {
    characterAssetId: 'placeholder_player',
    displayWidth: 42,
    displayHeight: 66,
    footOffsetX: 0,
    footOffsetY: 0,
    hitboxWidth: 26,
    hitboxHeight: 58,
    maxStepUp: 48,
    maxStepDown: 72,
    jumpHeight: 66,
    flightEnabled: false,
    flightSpeed: 260
  },
  environmentEffects: [],
  tileLayers: [],
  placements: [],
  collisionZones: [],
  terrainSegments: [],
  verticalTransports: [],
  minimap: {
    mode: 'auto',
    fogOfWar: true,
    showPlacements: true,
    showEvents: true,
    regionNotes: '',
    segments: []
  }
})

const mapForRoute = area => ({
  ...editorMapDefaults(area),
  height: 720,
  groundY: 570,
  platforms: [
    { id: 'route_deck_a', x: Math.round(area.width * 0.2), y: 438, width: Math.round(area.width * 0.18) },
    { id: 'route_deck_b', x: Math.round(area.width * 0.62), y: 410, width: Math.round(area.width * 0.14) }
  ],
  eventPoints: (routeEvents[area.id] ?? []).map(([id, label, x]) => ({ id, label, x })),
  speechLines: [
    `${area.name}に到着した。`,
    area.description,
    area.exits.some(exit => exit.depthDirection === 'front')
      ? '手前側へ伸びる道も移動に使えそうだ。'
      : '緑の案内表示で次のエリアを確認しよう。'
  ]
})

const mapForFacility = area => ({
  ...editorMapDefaults(area),
  height: 720,
  groundY: 570,
  platforms: [{ id: 'facility_upper_deck', x: 610, y: 420, width: 620 }],
  eventPoints: [{ id: `${area.id}_main`, label: area.description, x: 980 }],
  speechLines: [
    `${area.name}の内部だ。`,
    area.description,
    '入口から元の道路へ戻れる。'
  ]
})

const readExistingJson = async (fileName, fallback) => {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, fileName), 'utf8'))
  } catch {
    return fallback
  }
}
const existingMaster = await readExistingJson('areaMaster.json', { districts: [], areas: [] })
const existingDrafts = await readExistingJson('areaMapDrafts.json', { maps: {} })
const existingStates = await readExistingJson('areaStateDefaults.json', { areaStates: {} })
const preservedDistricts = existingMaster.districts.filter(district => district.layer === 'exterior')
const preservedAreas = existingMaster.areas.filter(area => area.layer === 'exterior')
const preservedAreaIds = new Set(preservedAreas.map(area => area.id))

const master = {
  version: 7,
  districts: [...districts, ...preservedDistricts],
  areas: [...areas, ...preservedAreas]
}
const drafts = {
  version: 7,
  maps: {
    ...Object.fromEntries(areas.map(area => [
      area.id,
      area.areaKind === 'route' ? mapForRoute(area) : mapForFacility(area)
    ])),
    ...Object.fromEntries(
      Object.entries(existingDrafts.maps).filter(([areaId]) => preservedAreaIds.has(areaId))
    )
  }
}
const states = {
  version: 7,
  areaStates: {
    ...Object.fromEntries(areas.map(area => [
      area.id,
      {
        openedDoors: [],
        defeatedEnemies: [],
        collectedItems: [],
        repairedFacilities: [],
        rescuedNpcs: [],
        alarmState: 'normal',
        clearedBoss: false,
        unlockedExits: []
      }
    ])),
    ...Object.fromEntries(
      Object.entries(existingStates.areaStates).filter(([areaId]) => preservedAreaIds.has(areaId))
    )
  }
}

await fs.writeFile(path.join(dataDir, 'areaMaster.json'), `${JSON.stringify(master, null, 2)}\n`, 'utf8')
await fs.writeFile(path.join(dataDir, 'areaMapDrafts.json'), `${JSON.stringify(drafts, null, 2)}\n`, 'utf8')
await fs.writeFile(path.join(dataDir, 'areaStateDefaults.json'), `${JSON.stringify(states, null, 2)}\n`, 'utf8')

const summary = areas.reduce((groups, area) => {
  groups[area.layer] ||= []
  groups[area.layer].push(area)
  return groups
}, {})
console.log(Object.fromEntries(Object.entries(summary).map(([layer, layerAreas]) => [layer, {
  routes: layerAreas.filter(area => area.areaKind === 'route').length,
  facilities: layerAreas.filter(area => area.areaKind === 'facility').length
}])))
