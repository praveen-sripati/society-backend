const visitorsService = require('../services/visitorsService');

class VisitorsController {
  async createPreApproval(req, res) {
    const { visitor_name, arrival_time, departure_time, purpose, apartment_number } = req.body;
    const resident_id = req.user.userId;

    if (!visitor_name || !arrival_time || !apartment_number) {
      return res.status(400).json({ error: 'Visitor name, arrival time, and apartment number are required.' });
    }

    try {
      const preApproval = await visitorsService.createPreApproval(
        resident_id,
        visitor_name,
        arrival_time,
        departure_time,
        purpose,
        apartment_number
      );
      res.status(201).json({ message: 'Pre-approval created successfully.', pre_approval: preApproval });
    } catch (error) {
      console.error('Error in createPreApproval controller:', error);
      res.status(500).json({ error: 'An error occurred while creating the pre-approval.' });
    }
  }

  async getAllPreApprovals(req, res) {
    try {
      const preApprovals = await visitorsService.getAllPreApprovals();
      res.status(200).json(preApprovals);
    } catch (error) {
      console.error('Error in getPreApprovalsByResident controller:', error);
      res.status(500).json({ error: 'An error occurred while fetching pre-approvals.' });
    }
  }

  async getPaginatedPreApprovals(req, res) {
    const { page, limit } = req.query;

    try {
      const result = await visitorsService.getPaginatedPreApprovals(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getPaginatedPreApprovals controller:', error);
      return res.status(500).json({ error: 'An error occurred while fetching pre-approvals.' });
    }
  }

  async getPaginatedPreApprovalsStatusPending(req, res) {
    const { page, limit } = req.query;

    try {
      const result = await visitorsService.getPaginatedPreApprovalsStatusPending(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getPaginatedPreApprovalsStatusPending controller:', error);
      return res.status(500).json({ error: 'An error occurred while fetching pre-approvals.' });
    }
  }

  async getPaginatedPreApprovalsStatusExpired(req, res) {
    const { page, limit } = req.query;

    try {
      const result = await visitorsService.getPaginatedPreApprovalsStatusExpired(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getPaginatedPreApprovals controller:', error);
      return res.status(500).json({ error: 'An error occurred while fetching pre-approvals.' });
    }
  }

  async getPreApprovalById(req, res) {
    const { id } = req.params;

    try {
      const preApproval = await visitorsService.getPreApprovalById(id);

      if (!preApproval) {
        return res.status(404).json({ error: 'Pre-approval not found.' });
      }

      res.status(200).json(preApproval);
    } catch (error) {
      console.error('Error in getPreApprovalById controller:', error);
      res.status(500).json({ error: 'An error occurred while fetching the pre-approval.' });
    }
  }

  async updatePreApproval(req, res) {
    const { id } = req.params;
    const { visitor_name, arrival_time, departure_time, purpose, apartment_number } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
      // 1. Get existing pre-approval using the service
      const existingPreApproval = await visitorsService.getPreApprovalById(id);

      if (!existingPreApproval) {
        return res.status(404).json({ error: 'Pre-approval not found.' });
      }

      // 2. Authorization check (using the fetched pre-approval data)
      if (userRole !== 'admin' && userId !== existingPreApproval.resident_id) {
        return res.status(403).json({ error: 'You are not authorized to update this pre-approval.' });
      }

      // 3. Update the pre-approval (using the service)
      const updatedPreApproval = await visitorsService.updatePreApproval(
        id,
        visitor_name,
        arrival_time,
        departure_time,
        purpose,
        apartment_number
      );

      res.status(200).json({ message: 'Pre-approval updated successfully.', pre_approval: updatedPreApproval });
    } catch (error) {
      console.error('Error in updatePreApproval controller:', error);
      res.status(500).json({ error: 'An error occurred while updating the pre-approval.' });
    }
  }

  async deletePreApproval(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
      // 1. Get existing pre-approval using the service
      const existingPreApproval = await visitorsService.getPreApprovalById(id);

      if (!existingPreApproval) {
        return res.status(404).json({ error: 'Pre-approval not found.' });
      }

      // 2. Authorization check (using the fetched pre-approval data)
      if (userRole !== 'admin' && userId !== existingPreApproval.resident_id) {
        return res.status(403).json({ error: 'You are not authorized to delete this pre-approval.' });
      }

      // 3. Delete the pre-approval (using the service)
      await visitorsService.deletePreApproval(id);

      res.status(200).json({ message: 'Pre-approval deleted successfully.' });
    } catch (error) {
      console.error('Error in deletePreApproval controller:', error);
      res.status(500).json({ error: 'An error occurred while deleting the pre-approval.' });
    }
  }

  async createArrival(req, res) {
    try {
      const arrival = await visitorsService.createArrival(req.body, req.user.userId);
      res.status(201).json(arrival);
    } catch (error) {
      console.error('Error in createArrival controller:', error);
      res.status(500).json({ error: 'An error occurred while checking in the visitor.' });
    }
  }

  async createDeparture(req, res) {
    try {
      const departure = await visitorsService.createDeparture(req.params.arrivalId, req.user.userId);
      if (!departure) {
        return res.status(404).json({ error: 'Visitor arrival record not found.' });
      }
      res.status(200).json(departure);
    } catch (error) {
      console.error('Error in createDeparture controller:', error);
      res.status(500).json({ error: 'An error occurred while checking out the visitor.' });
    }
  }

  async getArrivals(req, res) {
    try {
      const arrivals = await visitorsService.getArrivals(req.query.date, req.query.page, req.query.limit);
      res.status(200).json(arrivals);
    } catch (error) {
      console.error('Error in getArrivals controller:', error);
      res.status(500).json({ error: 'Failed to fetch arrivals.' });
    }
  }

  async getDepartures(req, res) {
    try {
      const departures = await visitorsService.getDepartures(req.query.date, req.query.page, req.query.limit);
      res.status(200).json(departures);
    } catch (error) {
      console.error('Error in getDepartures controller:', error);
      res.status(500).json({ error: 'Failed to fetch departures.' });
    }
  }

  async getPaginatedArrivals(req, res) {
    try {
      const paginatedArrivals = await visitorsService.getPaginatedArrivals(
        req.query.date,
        req.query.page,
        req.query.limit
      );
      res.status(200).json(paginatedArrivals);
    } catch (error) {
      console.error('Error in getPaginatedArrivals controller:', error);
      res.status(500).json({ error: 'Failed to fetch paginated arrivals.' });
    }
  }

  async getPaginatedDepartures(req, res) {
    try {
      const paginatedDepartures = await visitorsService.getPaginatedDepartures(
        req.query.date,
        req.query.page,
        req.query.limit
      );
      res.status(200).json(paginatedDepartures);
    } catch (error) {
      console.error('Error in getPaginatedDepartures controller:', error);
      res.status(500).json({ error: 'Failed to fetch paginated departures.' });
    }
  }

  async getVisitorActivityForResident(req, res) {
    try {
      const activity = await visitorsService.getVisitorActivityForResident(req.params.residentId);
      res.status(200).json(activity);
    } catch (error) {
      console.error('Error in getVisitorActivityForResident controller:', error);
      res.status(500).json({ error: 'Failed to fetch visitor activity.' });
    }
  }
}

module.exports = new VisitorsController();
