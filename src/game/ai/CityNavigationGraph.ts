import * as THREE from 'three'

export interface NavNode {
  id: string
  position: THREE.Vector3
  district: 'town_centre' | 'beach_promenade' | 'fishing_harbour' | 'market_district' | 'residential_district' | 'countryside_edge'
  connections: string[]
  isRestArea?: boolean
  tags?: string[]
}

/**
 * CityNavigationGraph
 * Milestone 3: Interconnected pedestrian navigation graph across all 6 explorable city districts.
 * Guarantees accessible, obstacle-free paths along sidewalks, plazas, concourses, and decks.
 */
export class CityNavigationGraph {
  private nodes = new Map<string, NavNode>()

  constructor() {
    this.buildGraph()
  }

  private addNode(node: NavNode): void {
    this.nodes.set(node.id, node)
  }

  private connect(idA: string, idB: string): void {
    const nodeA = this.nodes.get(idA)
    const nodeB = this.nodes.get(idB)
    if (nodeA && nodeB) {
      if (!nodeA.connections.includes(idB)) nodeA.connections.push(idB)
      if (!nodeB.connections.includes(idA)) nodeB.connections.push(idA)
    }
  }

  private buildGraph(): void {
    // -------------------------------------------------------------------------
    // 1. TOWN CENTRE DISTRICT (Plaza, Monument & Lighthouse Approach)
    // -------------------------------------------------------------------------
    this.addNode({
      id: 'tc_plaza_center',
      position: new THREE.Vector3(2.0, 0.35, 8.0),
      district: 'town_centre',
      connections: [],
    })
    this.addNode({
      id: 'tc_plaza_west',
      position: new THREE.Vector3(-3.8, 0.35, 8.0),
      district: 'town_centre',
      connections: [],
    })
    this.addNode({
      id: 'tc_plaza_east',
      position: new THREE.Vector3(8.0, 0.35, 8.0),
      district: 'town_centre',
      connections: [],
    })
    this.addNode({
      id: 'tc_plaza_north',
      position: new THREE.Vector3(2.0, 0.35, 1.0),
      district: 'town_centre',
      connections: [],
    })
    this.addNode({
      id: 'tc_plaza_south',
      position: new THREE.Vector3(2.0, 0.35, 13.0),
      district: 'town_centre',
      connections: [],
    })
    this.addNode({
      id: 'tc_lighthouse_approach',
      position: new THREE.Vector3(0.0, 0.35, -2.0),
      district: 'town_centre',
      connections: [],
      isRestArea: true,
      tags: ['scenic', 'monument'],
    })
    this.addNode({
      id: 'tc_west_sidewalk',
      position: new THREE.Vector3(-4.5, 0.05, 8.0),
      district: 'town_centre',
      connections: [],
    })
    this.addNode({
      id: 'tc_east_sidewalk',
      position: new THREE.Vector3(14.0, 0.05, 8.0),
      district: 'town_centre',
      connections: [],
    })

    this.connect('tc_plaza_center', 'tc_plaza_west')
    this.connect('tc_plaza_center', 'tc_plaza_east')
    this.connect('tc_plaza_center', 'tc_plaza_north')
    this.connect('tc_plaza_center', 'tc_plaza_south')
    this.connect('tc_plaza_north', 'tc_lighthouse_approach')
    this.connect('tc_plaza_west', 'tc_west_sidewalk')
    this.connect('tc_plaza_east', 'tc_east_sidewalk')

    // -------------------------------------------------------------------------
    // 2. BEACH DISTRICT & PROMENADE (Scenic concourse, belvedere, grand stairs)
    // -------------------------------------------------------------------------
    this.addNode({
      id: 'bp_belvedere_south',
      position: new THREE.Vector3(-20.0, 0.25, -120.0),
      district: 'beach_promenade',
      connections: [],
      isRestArea: true,
      tags: ['belvedere', 'scenic', 'bench'],
    })
    this.addNode({
      id: 'bp_south_1',
      position: new THREE.Vector3(-20.0, 0.25, -80.0),
      district: 'beach_promenade',
      connections: [],
      tags: ['bench'],
    })
    this.addNode({
      id: 'bp_south_2',
      position: new THREE.Vector3(-20.0, 0.25, -45.0),
      district: 'beach_promenade',
      connections: [],
    })
    this.addNode({
      id: 'bp_shack_deck',
      position: new THREE.Vector3(-34.0, 0.40, -42.0),
      district: 'beach_promenade',
      connections: [],
      isRestArea: true,
      tags: ['cafe', 'shack'],
    })
    this.addNode({
      id: 'bp_crosswalk_mid',
      position: new THREE.Vector3(-20.0, 0.25, 0.0),
      district: 'beach_promenade',
      connections: [],
      tags: ['crosswalk', 'plaza_connector'],
    })
    this.addNode({
      id: 'bp_grand_stairs',
      position: new THREE.Vector3(-26.0, 0.15, 0.0),
      district: 'beach_promenade',
      connections: [],
    })
    this.addNode({
      id: 'bp_beach_sand',
      position: new THREE.Vector3(-36.0, 0.05, 0.0),
      district: 'beach_promenade',
      connections: [],
      tags: ['sand', 'waterline'],
    })
    this.addNode({
      id: 'bp_north_1',
      position: new THREE.Vector3(-20.0, 0.25, 25.0),
      district: 'beach_promenade',
      connections: [],
      tags: ['bench'],
    })
    this.addNode({
      id: 'bp_north_end',
      position: new THREE.Vector3(-20.0, 0.25, 42.0),
      district: 'beach_promenade',
      connections: [],
    })

    this.connect('bp_belvedere_south', 'bp_south_1')
    this.connect('bp_south_1', 'bp_south_2')
    this.connect('bp_south_2', 'bp_shack_deck')
    this.connect('bp_south_2', 'bp_crosswalk_mid')
    this.connect('bp_crosswalk_mid', 'bp_grand_stairs')
    this.connect('bp_grand_stairs', 'bp_beach_sand')
    this.connect('bp_crosswalk_mid', 'bp_north_1')
    this.connect('bp_north_1', 'bp_north_end')

    // -------------------------------------------------------------------------
    // 3. FISHING HARBOUR DISTRICT (Wharf, Co-op, auction pavilion & piers)
    // -------------------------------------------------------------------------
    this.addNode({
      id: 'fh_road_approach',
      position: new THREE.Vector3(-20.0, 0.05, 55.0),
      district: 'fishing_harbour',
      connections: [],
    })
    this.addNode({
      id: 'fh_wharf_entry',
      position: new THREE.Vector3(-30.0, 0.35, 55.0),
      district: 'fishing_harbour',
      connections: [],
    })
    this.addNode({
      id: 'fh_coop_front',
      position: new THREE.Vector3(-30.0, 0.40, 70.0),
      district: 'fishing_harbour',
      connections: [],
      tags: ['coop', 'office'],
    })
    this.addNode({
      id: 'fh_auction_apron',
      position: new THREE.Vector3(-38.0, 0.40, 75.0),
      district: 'fishing_harbour',
      connections: [],
      tags: ['auction', 'covered'],
    })
    this.addNode({
      id: 'fh_wharf_pier',
      position: new THREE.Vector3(-45.0, 0.35, 85.0),
      district: 'fishing_harbour',
      connections: [],
      isRestArea: true,
      tags: ['pier', 'moored_boats'],
    })
    this.addNode({
      id: 'fh_cold_storage',
      position: new THREE.Vector3(-24.0, 0.50, 75.0),
      district: 'fishing_harbour',
      connections: [],
      tags: ['warehouse', 'cargo'],
    })

    this.connect('bp_north_end', 'fh_road_approach')
    this.connect('fh_road_approach', 'fh_wharf_entry')
    this.connect('fh_wharf_entry', 'fh_coop_front')
    this.connect('fh_coop_front', 'fh_auction_apron')
    this.connect('fh_auction_apron', 'fh_wharf_pier')
    this.connect('fh_coop_front', 'fh_cold_storage')

    // -------------------------------------------------------------------------
    // 4. MARKET DISTRICT (Bazaar sidewalks, Chai stall, colonnade gallery)
    // -------------------------------------------------------------------------
    this.addNode({
      id: 'mk_west_curb',
      position: new THREE.Vector3(27.8, 0.05, 24.0),
      district: 'market_district',
      connections: [],
    })
    this.addNode({
      id: 'mk_chai_corner',
      position: new THREE.Vector3(27.8, 0.05, 30.0),
      district: 'market_district',
      connections: [],
      isRestArea: true,
      tags: ['chai', 'social'],
    })
    this.addNode({
      id: 'mk_mid_crosswalk',
      position: new THREE.Vector3(37.5, 0.05, 45.0),
      district: 'market_district',
      connections: [],
      tags: ['crosswalk'],
    })
    this.addNode({
      id: 'mk_east_curb',
      position: new THREE.Vector3(47.0, 0.05, 35.0),
      district: 'market_district',
      connections: [],
    })
    this.addNode({
      id: 'mk_arcade_colonnade',
      position: new THREE.Vector3(47.0, 0.35, 55.0),
      district: 'market_district',
      connections: [],
      tags: ['colonnade', 'shops'],
    })
    this.addNode({
      id: 'mk_north_gate',
      position: new THREE.Vector3(37.5, 0.05, 75.0),
      district: 'market_district',
      connections: [],
    })

    this.connect('mk_west_curb', 'mk_chai_corner')
    this.connect('mk_chai_corner', 'mk_mid_crosswalk')
    this.connect('mk_mid_crosswalk', 'mk_east_curb')
    this.connect('mk_east_curb', 'mk_arcade_colonnade')
    this.connect('mk_arcade_colonnade', 'mk_north_gate')
    this.connect('mk_mid_crosswalk', 'mk_north_gate')

    // -------------------------------------------------------------------------
    // 5. RESIDENTIAL DISTRICT (Tree-lined avenue, heritage villa, residence)
    // -------------------------------------------------------------------------
    this.addNode({
      id: 'res_avenue_west',
      position: new THREE.Vector3(14.0, 0.05, -35.0),
      district: 'residential_district',
      connections: [],
    })
    this.addNode({
      id: 'res_mid_walkway',
      position: new THREE.Vector3(28.0, 0.05, -35.0),
      district: 'residential_district',
      connections: [],
    })
    this.addNode({
      id: 'res_villa_gate',
      position: new THREE.Vector3(38.0, 0.05, -35.0),
      district: 'residential_district',
      connections: [],
      tags: ['villa', 'veranda'],
    })
    this.addNode({
      id: 'res_coastal_approach',
      position: new THREE.Vector3(50.0, 0.05, -35.0),
      district: 'residential_district',
      connections: [],
      tags: ['residence'],
    })
    this.addNode({
      id: 'res_east_walkway',
      position: new THREE.Vector3(65.0, 0.05, -35.0),
      district: 'residential_district',
      connections: [],
    })

    this.connect('res_avenue_west', 'res_mid_walkway')
    this.connect('res_mid_walkway', 'res_villa_gate')
    this.connect('res_villa_gate', 'res_coastal_approach')
    this.connect('res_coastal_approach', 'res_east_walkway')

    // -------------------------------------------------------------------------
    // 6. COUNTRYSIDE EDGE DISTRICT (Highway checkpoint, cabin, overlook)
    // -------------------------------------------------------------------------
    this.addNode({
      id: 'cs_highway_entry',
      position: new THREE.Vector3(75.0, 0.05, -70.0),
      district: 'countryside_edge',
      connections: [],
    })
    this.addNode({
      id: 'cs_outpost_apron',
      position: new THREE.Vector3(85.0, 0.15, -70.0),
      district: 'countryside_edge',
      connections: [],
      tags: ['checkpoint', 'cabin'],
    })
    this.addNode({
      id: 'cs_overlook',
      position: new THREE.Vector3(95.0, 0.05, -60.0),
      district: 'countryside_edge',
      connections: [],
      isRestArea: true,
      tags: ['scenic', 'coastal_highway'],
    })

    this.connect('cs_highway_entry', 'cs_outpost_apron')
    this.connect('cs_outpost_apron', 'cs_overlook')

    // -------------------------------------------------------------------------
    // 7. INTER-DISTRICT CONNECTOR NODES
    // -------------------------------------------------------------------------
    // Town Centre <-> Promenade (Marine Blvd Central Crosswalk)
    this.addNode({
      id: 'conn_tc_promenade',
      position: new THREE.Vector3(-10.0, 0.05, 0.0),
      district: 'town_centre',
      connections: [],
    })
    this.connect('tc_west_sidewalk', 'conn_tc_promenade')
    this.connect('conn_tc_promenade', 'bp_crosswalk_mid')

    // Town Centre <-> Fishing Harbour (Harbour Road)
    this.addNode({
      id: 'conn_tc_harbour',
      position: new THREE.Vector3(-10.0, 0.05, 35.0),
      district: 'town_centre',
      connections: [],
    })
    this.connect('tc_plaza_north', 'conn_tc_harbour')
    this.connect('conn_tc_harbour', 'fh_road_approach')

    // Town Centre <-> Market District (East Cross-street)
    this.addNode({
      id: 'conn_tc_market',
      position: new THREE.Vector3(20.0, 0.05, 16.0),
      district: 'town_centre',
      connections: [],
    })
    this.connect('tc_east_sidewalk', 'conn_tc_market')
    this.connect('conn_tc_market', 'mk_west_curb')

    // Town Centre <-> Residential District (South Boulevard)
    this.addNode({
      id: 'conn_tc_residential',
      position: new THREE.Vector3(10.0, 0.05, -15.0),
      district: 'town_centre',
      connections: [],
    })
    this.connect('tc_plaza_south', 'conn_tc_residential')
    this.connect('conn_tc_residential', 'res_avenue_west')

    // Residential District <-> Countryside Outpost (Highway link)
    this.addNode({
      id: 'conn_res_countryside',
      position: new THREE.Vector3(70.0, 0.05, -55.0),
      district: 'residential_district',
      connections: [],
    })
    this.connect('res_east_walkway', 'conn_res_countryside')
    this.connect('conn_res_countryside', 'cs_highway_entry')
  }

  public getNode(id: string): NavNode | undefined {
    return this.nodes.get(id)
  }

  public getAllNodes(): NavNode[] {
    return Array.from(this.nodes.values())
  }

  public getNodesInDistrict(district: string): NavNode[] {
    return Array.from(this.nodes.values()).filter(n => n.district === district)
  }

  public getNearestNode(pos: THREE.Vector3, filterDistrict?: string): NavNode {
    let bestNode: NavNode | null = null
    let bestDistSq = Infinity

    for (const node of this.nodes.values()) {
      if (filterDistrict && node.district !== filterDistrict) continue
      const distSq = pos.distanceToSquared(node.position)
      if (distSq < bestDistSq) {
        bestDistSq = distSq
        bestNode = node
      }
    }

    return bestNode || Array.from(this.nodes.values())[0]
  }

  public getRandomConnectedNode(nodeId: string): NavNode {
    const node = this.nodes.get(nodeId)
    if (!node || node.connections.length === 0) {
      return this.getRandomNode()
    }
    const targetId = node.connections[Math.floor(Math.random() * node.connections.length)]
    return this.nodes.get(targetId) || node
  }

  public getRandomNode(filterDistrict?: string): NavNode {
    const list = filterDistrict ? this.getNodesInDistrict(filterDistrict) : this.getAllNodes()
    return list[Math.floor(Math.random() * list.length)]
  }

  /**
   * Breadth-First-Search shortest path computation between two graph nodes.
   */
  public findShortestPath(startNodeId: string, endNodeId: string): THREE.Vector3[] {
    if (startNodeId === endNodeId) {
      const n = this.nodes.get(startNodeId)
      return n ? [n.position.clone()] : []
    }

    const queue: string[] = [startNodeId]
    const visited = new Set<string>([startNodeId])
    const parentMap = new Map<string, string>()

    let found = false
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === endNodeId) {
        found = true
        break
      }

      const node = this.nodes.get(current)
      if (!node) continue

      for (const neighborId of node.connections) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          parentMap.set(neighborId, current)
          queue.push(neighborId)
        }
      }
    }

    if (!found) {
      // Fallback: direct line to end node
      const end = this.nodes.get(endNodeId)
      return end ? [end.position.clone()] : []
    }

    // Reconstruct path backward
    const path: THREE.Vector3[] = []
    let curr: string | undefined = endNodeId
    while (curr) {
      const n = this.nodes.get(curr)
      if (n) path.unshift(n.position.clone())
      curr = parentMap.get(curr)
    }

    return path
  }
}
