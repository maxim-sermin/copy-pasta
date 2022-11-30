package com.mnm.copypastabackend.repositories;

import java.util.List;
import java.util.Optional;

import com.mnm.copypastabackend.entities.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {
    public Optional<Label> findByNameIgnoreCase(String name);

    @Query("select l.name from Label l")
    public List<String> getLabelNames();

    public List<Label> findAllByOrderByName();
}
