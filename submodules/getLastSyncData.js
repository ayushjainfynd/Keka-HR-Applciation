import { AppDataSource } from '../db/index.js';
import { ApiHitLog } from '../db/models/apiHitLog.js';

const apiHitLogRepository = AppDataSource.getRepository(ApiHitLog);

async function getLastSyncData(req, res) {
  try {
    // Check if the table exists
    const tableExists = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'api_hit_log'
      )
    `);

    
    if (!tableExists[0].exists) {
      return res.status(404).json({ message: "Table 'api_hit_log' does not exist." });
    }

    // Fetch the last updated entry
    const [lastHit] = await apiHitLogRepository.find({
      order: { time: 'DESC' }, // Sort by timestamp in descending order
      take: 1, // Limit to 1 record
    });

    if (!lastHit) {
      return res.status(404).json({ message: 'No API hit records found.' });
    }

    return res.status(200).json({
      message: 'Last API hit data retrieved successfully.',
      data: lastHit,
    });
  } catch (error) {
    console.error('Error fetching last sync data:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

export { getLastSyncData };
