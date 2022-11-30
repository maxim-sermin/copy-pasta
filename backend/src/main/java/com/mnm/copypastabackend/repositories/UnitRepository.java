package com.mnm.copypastabackend.repositories;

import com.mnm.copypastabackend.entities.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {
    public Optional<Unit> findByNameIgnoreCase(String name);

    public List<Unit> findAllByOrderByName();
}
