import { query } from './db';
import crypto from 'crypto';

export async function seedDetectiveCases(): Promise<void> {
  try {
    const existingCases = await query<any[]>('SELECT case_id, title FROM detective_cases');
    const existingTitles = new Set((existingCases || []).map((c) => c.title));

    // ========================================================
    // CASE 1: EASY — The Gallery Mirage
    // ========================================================
    if (!existingTitles.has('The Gallery Mirage')) {
      const caseRes: any = await query(
        `INSERT INTO detective_cases (title, synopsis, difficulty, investigation_budget, incident_location, incident_time, is_active)
         VALUES (?, ?, 'EASY', 100, ?, ?, TRUE)`,
        [
          'The Gallery Mirage',
          'At 11:45 PM during the midnight gala at Valois Modern Art Gallery, the prized digital holocube "Elysium" was substituted with a counterfeit hologram. The acoustic vibration grid was silently suppressed from the maintenance booth.',
          'Valois Modern Art Gallery, Sector 4',
          '11:45 PM'
        ]
      );
      const caseId = caseRes.insertId;

      // Suspects
      const [s1]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Pierre Dubois',
          'Gallery Curator',
          'Oversees the collection and curates private auctions. Deeply proud of the gallery international reputation.',
          'Claims he was in the VIP lounge greeting patrons and ordering champagne from 11:35 PM to 11:55 PM.',
          'I was by the champagne bar discussing post-modern sculptures with patrons. Check the bar register if you doubt me.',
          'Protecting gallery prestige; had zero financial incentive to steal his own centerpiece.'
        ]
      );

      const [s2]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, TRUE, 10, ?, ?)`,
        [
          caseId,
          'Maya Lin',
          'Security Technician',
          'Former hardware designer who configured the gallery biometric terminals and vibration grid. Under heavy gambling debts.',
          'Claims she was running diagnostic tests on the exterior floodlights from the maintenance booth.',
          'I only accessed the maintenance terminal to check camera calibration. If the vibration grid went down, it must have been a voltage surge!',
          'Under severe pressure from black-market syndicates to deliver high-value holographic tech.'
        ]
      );

      const [s3]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Victor Vance',
          'Antiquities Dealer',
          'Shrewd dealer known for aggressive acquisitions. Arrived at the gala uninvited.',
          'Claims he stepped out onto the east terrace to take a satellite call between 11:40 and 11:50 PM.',
          'I was on the terrace taking a satellite call with Geneva. It was cold, but my business deals do not wait for art galas.',
          'Interested in acquiring the piece legally through private auction, not crude theft.'
        ]
      );

      // Locations
      const [l1]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Main Exhibition Pedestal',
          'The illuminated glass pedestal where "Elysium" was displayed before being swapped.',
          'Micro-scratches on the pedestal acrylic and residual optical distortion from a low-grade holographic projector.'
        ]
      );

      const [l2]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Maintenance Control Booth',
          'A cramped terminal room housing the security relays and terminal overrides.',
          'A terminal session was left open with admin badge #4421 logged in. The vibration grid was deliberately toggled off at 11:43 PM.'
        ]
      );

      const [l3]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'East Terrace',
          'An outdoor viewing balcony overlooking the city skyline.',
          'Discarded cigarette butts matching Victor Vance brand and strong cellular reception.'
        ]
      );

      // Evidence
      const [e1]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, TRUE, FALSE)`,
        [
          caseId,
          l1.insertId,
          s2.insertId,
          'Counterfeit Holocube Transmitter',
          'A portable projector displaying a static loop of "Elysium". Found left on the pedestal.',
          'Fingerprints on the battery latch match Maya Lin. Serial numbers trace to a known black-market synthesizer kit.'
        ]
      );

      const [e2]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, TRUE, FALSE)`,
        [
          caseId,
          l2.insertId,
          s2.insertId,
          'Overridden Sensor Relay Shunt',
          'The primary vibration sensor circuit board was physically bypassed with a technician jumper wire.',
          'The bypass shunt bears the laser-etched inventory code of Maya Lin technician toolkit.'
        ]
      );

      const [e3]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 10, ?, FALSE, TRUE)`,
        [
          caseId,
          l3.insertId,
          s1.insertId,
          'VIP Bar Timestamped Receipt',
          'Itemized beverage tab stamped 11:42 PM under Pierre Dubois member account.',
          'Timestamp verified by POS server logs. Confirms Pierre presence in the lounge during the theft.'
        ]
      );

      // Clues
      await query(
        `INSERT INTO detective_clues (case_id, evidence_id, clue_text, action_cost, deduction_notes)
         VALUES 
         (?, ?, 'Terminal audit confirms badge #4421 (Maya Lin) bypassed the gallery grid at 11:43 PM.', 15, 'Points directly to technician override.'),
         (?, ?, 'Satellite phone records confirm Victor Vance was connected to a Geneva number from 11:41 to 11:49 PM.', 10, 'Corroborates Vance alibi.'),
         (?, ?, 'Curator Pierre Dubois personal bank account has zero irregular transfers or overseas liens.', 10, 'Clears curator of financial motive.')`,
        [caseId, e2.insertId, caseId, null, caseId, null]
      );

      // Timeline Events
      await query(
        `INSERT INTO detective_timeline_events (case_id, timestamp_label, event_description, suspect_id, is_verified)
         VALUES 
         (?, '11:30 PM', 'Gala guests assemble in the main hall around the central pedestal.', NULL, TRUE),
         (?, '11:40 PM', 'Pierre Dubois orders champagne at the VIP bar.', ?, TRUE),
         (?, '11:43 PM', 'Vibration sensor relay suppressed via technician badge #4421 in maintenance booth.', ?, TRUE),
         (?, '11:45 PM', 'Real holocube removed; counterfeit projector activated on pedestal.', ?, TRUE),
         (?, '11:50 PM', 'Victor Vance concludes his call on the east terrace.', ?, TRUE)`,
        [caseId, caseId, s1.insertId, caseId, s2.insertId, caseId, s2.insertId, caseId, s3.insertId]
      );

      // Puzzle
      const puzzleHash = crypto.createHash('sha256').update('MAYA').digest('hex');
      await query(
        `INSERT INTO detective_puzzles (case_id, prompt, puzzle_type, solution_hash, accepted_plaintext, hint, unlocked_clue_text, action_cost)
         VALUES (?, ?, 'CIPHER', ?, 'MAYA', ?, ?, 15)`,
        [
          caseId,
          'Decrypt the terminal bypass username: "SHIFT-1 CIPHER: NBYB"',
          puzzleHash,
          'Shift each letter backward by 1 position (N->M, B->A, Y->X/Y).',
          'Terminal audit confirms Maya Lin authorized the silent alarm override.'
        ]
      );

      // Solution
      await query(
        `INSERT INTO detective_case_solutions (case_id, culprit_suspect_id, motive, murder_weapon_or_method, critical_evidence_summary, explanation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          s2.insertId,
          'Black-market debt liquidation to illegal tech syndicates',
          'Disabled acoustic vibration grid via maintenance terminal override and replaced holocube with counterfeit',
          'Overridden Sensor Relay Shunt and Counterfeit Holocube Transmitter bearing Maya Lin toolkit marks',
          'Maya Lin used her administrative technician credentials to silence the vibration grid at 11:43 PM from the maintenance booth, swapping the real Elysium holocube for a cheap hologram before patrons noticed.'
        ]
      );
    }

    // ========================================================
    // CASE 2: MEDIUM — The Obsidian Heist
    // ========================================================
    if (!existingTitles.has('The Obsidian Heist')) {
      const caseRes: any = await query(
        `INSERT INTO detective_cases (title, synopsis, difficulty, investigation_budget, incident_location, incident_time, is_active)
         VALUES (?, ?, 'MEDIUM', 100, ?, ?, TRUE)`,
        [
          'The Obsidian Heist',
          'At 02:14 AM, the ultra-secure Blackwood Vault was breached. The legendary Midnight Sapphire vanished without tripping the acoustic grid. Chief Architect Dr. Vane was found drugged inside the mainframe chamber.',
          'Blackwood High-Security Vault, Sub-Level 4',
          '02:14 AM'
        ]
      );
      const caseId = caseRes.insertId;

      const [s1]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Julian Vance',
          'Security Overseer',
          'Former naval cryptographer who designed the acoustic perimeter.',
          'Claims he was recalibrating sensors in Sector C from 01:45 to 02:30 AM.',
          'My diagnostic terminal was hooked to Sector C all night. Look at the ping logs if you think I abandoned my post.',
          'Professional rivalry with Dr. Vane, but no financial motive.'
        ]
      );

      const [s2]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, TRUE, 10, ?, ?)`,
        [
          caseId,
          'Elena Rostova',
          'Systems Archivist',
          'Brilliant hacker recruited by Blackwood to oversee biometric records.',
          'States she was logged into the digital registry until power flickered at 02:10 AM.',
          'The power drop kicked me off the terminal at 02:10. When the lights came back on, Dr. Vane was already unconscious.',
          'Offshore crypto debts and lucrative black-market gem contact.'
        ]
      );

      const [s3]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Marcus Kane',
          'Vault Technician',
          'Senior mechanic with unrestricted physical bypass tools.',
          'Claims he was in the lower boiler room repairing steam pressure lines.',
          'I spent two hours knee-deep in boiler steam. You can check the steam valve telemetry.',
          'Frustrated by Blackwood corporate management, but loyal to his team.'
        ]
      );

      const [l1]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Mainframe Chamber',
          'The heart of the facility. Dr. Vane was discovered slumped across Terminal 4.',
          'A half-empty coffee mug with sedative residue. The vault biometric console was bypassed via USB dongle.'
        ]
      );

      const [l2]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Acoustic Grid Relay',
          'Junction box controlling high-frequency vibration sensors in the vault corridor.',
          'The relay was bypassed via remote network packet rather than physical cut.'
        ]
      );

      const [l3]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Archivist Terminal',
          'Elena Rostova private workstation in the upper gallery overlooking the vault.',
          'A draft outbound encrypted transmission to an offshore broker offering the Midnight Sapphire.'
        ]
      );

      const [e1]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, TRUE, FALSE)`,
        [
          caseId,
          l1.insertId,
          s2.insertId,
          'Decoded Biometric Bypass Dongle',
          'A custom flash drive containing forged retinal signatures of Dr. Vane, formatted with Elena private encryption key.',
          'Hardware fingerprint matches Elena private laptop workstation. Timestamped 02:11 AM.'
        ]
      );

      const [e2]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, FALSE, TRUE)`,
        [
          caseId,
          l2.insertId,
          s1.insertId,
          'Burned Resistor Wire',
          'Surgically spliced sensor wire creating a 90-second blind spot in Sector C.',
          'Placed intentionally days earlier to distract investigators from the network-based bypass.'
        ]
      );

      const [e3]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, TRUE, FALSE)`,
        [
          caseId,
          l3.insertId,
          s2.insertId,
          'Unsent Encrypted Transmission',
          'Draft outbound packet to an offshore broker offering the Midnight Sapphire.',
          'Cryptographic ledger matches Elena private crypto wallet.'
        ]
      );

      await query(
        `INSERT INTO detective_clues (case_id, evidence_id, clue_text, action_cost, deduction_notes)
         VALUES 
         (?, ?, 'The bypass dongle timestamp proves it was inserted at 02:11 AM from Terminal 4.', 15, 'Confirms exact execution time.'),
         (?, ?, 'The acoustic relay was bypassed remotely via network packet, not physical wire splicing.', 15, 'Eliminates technician Marcus Kane.'),
         (?, ?, 'Offshore wallet address in draft packet matches Elena personal cryptographic ledger.', 15, 'Establishes direct financial motive.')`,
        [caseId, e1.insertId, caseId, e2.insertId, caseId, e3.insertId]
      );

      await query(
        `INSERT INTO detective_timeline_events (case_id, timestamp_label, event_description, suspect_id, is_verified)
         VALUES 
         (?, '01:50 AM', 'Marcus Kane clocks in at the boiler station; steam telemetry confirms continuous manual operation.', ?, TRUE),
         (?, '02:08 AM', 'Dr. Vane accepts a coffee delivery at the Mainframe door.', NULL, TRUE),
         (?, '02:11 AM', 'Terminal 4 registers forced root bypass using Elena cryptographic dongle.', ?, TRUE),
         (?, '02:14 AM', 'Vault pressure seal opens; Midnight Sapphire removed from pedestal.', ?, TRUE)`,
        [caseId, s3.insertId, caseId, caseId, s2.insertId, caseId, s2.insertId]
      );

      const pHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      await query(
        `INSERT INTO detective_puzzles (case_id, prompt, puzzle_type, solution_hash, accepted_plaintext, hint, unlocked_clue_text, action_cost)
         VALUES (?, ?, 'CIPHER', ?, 'CORRECT', ?, ?, 20)`,
        [
          caseId,
          'Decrypt the root terminal bypass code: "SHIFT-3 CIPHER: FRUUFSW"',
          pHash,
          'Shift each letter backward by 3 positions.',
          'Terminal 4 system log confirms root packet originated from Elena archivist terminal IP.'
        ]
      );

      await query(
        `INSERT INTO detective_case_solutions (case_id, culprit_suspect_id, motive, murder_weapon_or_method, critical_evidence_summary, explanation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          s2.insertId,
          'Offshore liquidation for cryptographic windfall and black-market sale',
          'Administered sleeping sedative in coffee and bypassed retinal sensors with custom dongle',
          'Decoded Biometric Bypass Dongle formatted with Elena personal encryption key',
          'Elena Rostova drugged Dr. Vane and used her forged biometric dongle at 02:11 AM to remotely suppress acoustic sensors and steal the Midnight Sapphire.'
        ]
      );
    }

    // ========================================================
    // CASE 3: HARD — The Alchemist's Poison
    // ========================================================
    if (!existingTitles.has("The Alchemist's Poison")) {
      const caseRes: any = await query(
        `INSERT INTO detective_cases (title, synopsis, difficulty, investigation_budget, incident_location, incident_time, is_active)
         VALUES (?, ?, 'HARD', 120, ?, ?, TRUE)`,
        [
          "The Alchemist's Poison",
          'Lead biochemist Dr. Aris Thorne was found fatally poisoned inside the hermetic synthesis cleanroom during the classified synthesis of Project Chimera. The room was sealed with dual-keycard biometric interlocks.',
          'NeuroGen Research Facility, Sub-Level 3',
          '03:30 AM'
        ]
      );
      const caseId = caseRes.insertId;

      const [s1]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Dr. Simon Hale',
          'Senior Chemist',
          'Rival researcher passed over for promotion to lead Chimera. Bitter toward Thorne.',
          'Claims he was asleep in the staff night dormitory from 01:00 AM to 04:00 AM.',
          'I wanted the Chimera lead, but I am not an assassin. The dormitory keycard log will show I never opened my door.',
          'Professional envy, but lacked access to the HVAC filtration manifold.'
        ]
      );

      const [s2]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, TRUE, 10, ?, ?)`,
        [
          caseId,
          'Dr. Vivienne Cross',
          'Lead Pharmacologist',
          'Brilliant toxicologist who developed Chimera delivery solvent. Quietly under investigation for patent transfers.',
          'Claims her lab keycard was cloned two days prior and that she was calibrating spectrometers in Sector B.',
          'My keycard was reported cloned on Tuesday. Anyone could have used my credentials to access cold storage.',
          'Thorne discovered her unauthorized patent sales to a foreign biopharma conglomerate.'
        ]
      );

      const [s3]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Thomas Briggs',
          'Facility Operations Director',
          'Oversees HVAC systems and cleanroom pressurization controls.',
          'Claims he was troubleshooting coolant pressure in the lower auxiliary pump room.',
          'The HVAC alerts pinged my phone at 03:22, but I was already down in the sub-pump room fixing coolant line 3.',
          'Bureaucratic overseer with no motive to jeopardize the project funding.'
        ]
      );

      const [s4]: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, FALSE, 10, ?, ?)`,
        [
          caseId,
          'Nadia Chen',
          'Research Fellow',
          'Young assistant who discovered Dr. Thorne body and triggered the facility alarm.',
          'Alibi confirms she was conducting continuous centrifuge runs on Level 2 until 03:40 AM.',
          'I was running the blood centrifuge on Level 2. The telemetry log proves I did not leave the centrifuge bench.',
          'Devoted mentee of Dr. Thorne with zero motive.'
        ]
      );

      const [l1]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Hermetic Cleanroom',
          'Sealed synthesis chamber with negative-pressure airlocks where Dr. Thorne collapsed.',
          'Chemical air sensors show lethal aconitine concentration delivered through the ceiling air supply.'
        ]
      );

      const [l2]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'HVAC Ventilation Hub',
          'The atmospheric supply plant providing filtered air to the cleanroom.',
          'A modified pressurized canister attached directly to the cleanroom primary air duct.'
        ]
      );

      const [l3]: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, 10, ?)`,
        [
          caseId,
          'Cold Storage Vault',
          'Ultra-low temperature storage containing toxic precursors and enzyme reagents.',
          'A vial of concentrated aconitine base was removed from tray #9 using falsified requisition #8812.'
        ]
      );

      const [e1]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, TRUE, FALSE)`,
        [
          caseId,
          l2.insertId,
          s2.insertId,
          'Modified Aerosol Canister',
          'Custom delivery nozzle fitted directly to the cleanroom HVAC manifold.',
          'Residue contains Vivienne proprietary hydrophobic fluoropolymer stabilizer, only synthesized in her personal lab.'
        ]
      );

      const [e2]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, TRUE, FALSE)`,
        [
          caseId,
          l3.insertId,
          s2.insertId,
          'Empty Aconitine Precursor Vial',
          'A discarded pharmaceutical vial found in the cold storage disposal chute.',
          'Requisition order #8812 was signed with Dr. Cross biometric key prior to her claiming the card was cloned.'
        ]
      );

      const [e3]: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, 15, ?, FALSE, TRUE)`,
        [
          caseId,
          l1.insertId,
          s1.insertId,
          'Thorne Personal Dictaphone',
          'An encrypted voice recorder found on Dr. Thorne laboratory bench.',
          'Thorne notes: "Discovered unauthorized chemical formula leaks today. Filing a formal disclosure with the board tomorrow."'
        ]
      );

      await query(
        `INSERT INTO detective_clues (case_id, evidence_id, clue_text, action_cost, deduction_notes)
         VALUES 
         (?, ?, 'Mass spectrometry confirms the aconitine aerosol was stabilized with Dr. Cross patented fluoropolymer.', 15, 'Direct physical link to Vivienne Cross.'),
         (?, ?, 'Facility HVAC logs show fan speed was spiked 40% at 03:22 AM to rapidly disperse the neurotoxin.', 15, 'Establishes precise delivery mechanism.'),
         (?, ?, 'Centrifuge telemetry verifies Nadia Chen was actively operating the Level 2 machine without pause.', 10, 'Completely clears Nadia Chen.')`,
        [caseId, e1.insertId, caseId, null, caseId, null]
      );

      await query(
        `INSERT INTO detective_timeline_events (case_id, timestamp_label, event_description, suspect_id, is_verified)
         VALUES 
         (?, '02:30 AM', 'Dr. Thorne enters the cleanroom and locks the hermetic biometric airlocks.', NULL, TRUE),
         (?, '03:15 AM', 'Cold storage accessed; aconitine precursor vial checked out under requisition #8812.', ?, TRUE),
         (?, '03:22 AM', 'Aerosol canister attached to HVAC manifold; atmospheric fan speed increased by 40%.', ?, TRUE),
         (?, '03:30 AM', 'Chemical sensors trigger neurotoxin alert; Dr. Thorne collapses inside cleanroom.', ?, TRUE),
         (?, '03:45 AM', 'Emergency alarm triggered by Nadia Chen upon observing Thorne through observation window.', ?, TRUE)`,
        [caseId, caseId, s2.insertId, caseId, s2.insertId, caseId, s2.insertId, caseId, s4.insertId]
      );

      const pHash3 = crypto.createHash('sha256').update('LETHAL').digest('hex');
      await query(
        `INSERT INTO detective_puzzles (case_id, prompt, puzzle_type, solution_hash, accepted_plaintext, hint, unlocked_clue_text, action_cost)
         VALUES (?, ?, 'CIPHER', ?, 'LETHAL', ?, ?, 20)`,
        [
          caseId,
          'Decipher the forensic reagent hazard rating: "Hg-Au-Pt -> Synthesized neurotoxin potency code"',
          pHash3,
          'Identify the deadly nature of the synthesized aconitine aerosol (6 letters: LETHAL).',
          'Forensic audit proves the aconitine formulation was tailored specifically to bypass cleanroom HEPA filters.'
        ]
      );

      await query(
        `INSERT INTO detective_case_solutions (case_id, culprit_suspect_id, motive, murder_weapon_or_method, critical_evidence_summary, explanation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          s2.insertId,
          'Prevent Thorne from filing a whistleblower report regarding illegal patent transfers',
          'Synthesized aconitine aerosol dispersed through HVAC manifold with proprietary polymer stabilizer',
          'Modified Aerosol Canister containing Vivienne proprietary stabilizer and requisition #8812 records',
          'Dr. Vivienne Cross fitted a pressurized aerosol canister containing aconitine and her patented stabilizer to the HVAC manifold at 03:22 AM, poisoning Dr. Thorne to prevent him from exposing her corporate espionage.'
        ]
      );
    }
  } catch (err: any) {
    console.error('[seedDetectiveCases Error]:', err.message);
  }
}
