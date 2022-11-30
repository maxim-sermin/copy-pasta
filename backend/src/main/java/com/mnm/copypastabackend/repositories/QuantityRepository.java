package com.mnm.copypastabackend.repositories;

import com.mnm.copypastabackend.entities.Quantity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuantityRepository extends JpaRepository<Quantity, Long> {

}
